import { prisma } from '../lib/prisma';
import { Promotion, OrderType, PromotionType, RewardType } from '@prisma/client';

export interface EligibilityRules {
  min_order_amount?: number;
  specific_menu_items?: string[];
  specific_categories?: string[];
  order_types?: string[];
  
  // Buy X Get Y
  buy_item_id?: string;
  buy_quantity?: number;
  
  // Combo offer
  combo_items?: { menu_item_id: string; quantity: number }[];
}

export interface RewardConfig {
  discount_value?: number; // Percentage or fixed value
  max_discount_amount?: number;
  target_item_id?: string; // For BOGO, FREE_ITEM, FREE_DRINK, or BUY_X_GET_Y Y-item
  target_quantity?: number; // For BUY_X_GET_Y Y-quantity
  combo_price?: number; // Special price for COMBO_PRICE
}

export interface ScheduleConfig {
  valid_days?: number[]; // 0-6 (0 = Sunday)
  start_time?: string; // "HH:MM"
  end_time?: string; // "HH:MM"
  season_name?: string;
}

export interface CartItem {
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  category_id?: string;
}

export interface EvaluationResult {
  promotion_id: string | null;
  promotion_title: string | null;
  discount_amount: number;
  hints: string[];
}

export class PromotionEngine {
  
  static async evaluateCart(
    tenantId: string,
    customerId: string | null,
    items: CartItem[],
    orderType: OrderType
  ): Promise<EvaluationResult> {
    
    let bestDiscount = 0;
    let bestPromotionId = null;
    let bestPromotionTitle = null;
    const hints: string[] = [];
    
    // 1. Calculate raw subtotal
    const subtotal = items.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
    if (subtotal <= 0) {
      return { promotion_id: null, promotion_title: null, discount_amount: 0, hints: [] };
    }

    // 2. Fetch all active promotions for the tenant
    const now = new Date();
    const activePromotions = await prisma.promotion.findMany({
      where: {
        tenant_id: tenantId,
        is_active: true,
        archived: false,
        status: 'ACTIVE',
        start_date: { lte: now },
        end_date: { gte: now }
      }
    });

    // 3. Gather customer details if customer ID is present
    let orderCount = 0;
    if (customerId) {
      orderCount = await prisma.order.count({
        where: {
          customer_id: customerId,
          status: { in: ['COMPLETED', 'DELIVERED'] }
        }
      });
    }

    // 4. Evaluate each promotion
    for (const promo of activePromotions) {
      const rules = promo.eligibility_rules as unknown as EligibilityRules | null;
      const reward = promo.reward_config as unknown as RewardConfig | null;
      const schedule = promo.schedule_config as unknown as ScheduleConfig | null;
      
      let isEligible = true;

      // ─── PART A: PROMOTION TYPE ELIGIBILITY RULES ───
      switch (promo.type) {
        case PromotionType.FIRST_ORDER:
        case PromotionType.NEW_CUSTOMER:
          // Customers with 0 completed orders
          if (orderCount > 0) {
            isEligible = false;
          }
          break;

        case PromotionType.RETURNING_CUSTOMER:
          // Must have placed at least 1 completed order
          if (orderCount === 0) {
            isEligible = false;
            hints.push("Place your first order to unlock returning customer deals next time!");
          }
          break;

        case PromotionType.HAPPY_HOUR:
          if (schedule) {
            const todayDay = now.getDay();
            if (schedule.valid_days && schedule.valid_days.length > 0 && !schedule.valid_days.includes(todayDay)) {
              isEligible = false;
            }
            if (schedule.start_time && schedule.end_time) {
              const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
              const [startH, startM] = schedule.start_time.split(':').map(Number);
              const [endH, endM] = schedule.end_time.split(':').map(Number);
              const startTimeMinutes = startH * 60 + startM;
              const endTimeMinutes = endH * 60 + endM;

              if (currentTimeMinutes < startTimeMinutes || currentTimeMinutes > endTimeMinutes) {
                isEligible = false;
              }
            }
          } else {
            isEligible = false;
          }
          break;

        case PromotionType.WEEKEND_PROMOTION:
          const day = now.getDay();
          // Sunday (0) or Saturday (6)
          if (day !== 0 && day !== 6) {
            isEligible = false;
          }
          break;

        case PromotionType.MINIMUM_SPEND:
          const minAmount = rules?.min_order_amount || 0;
          if (subtotal < minAmount) {
            isEligible = false;
            const diff = minAmount - subtotal;
            if (diff > 0 && diff <= 30) {
              hints.push(`Spend $${diff.toFixed(2)} more to qualify for: "${promo.title}"`);
            }
          }
          break;

        case PromotionType.BUY_X_GET_Y:
          if (rules?.buy_item_id && rules?.buy_quantity) {
            const buyItem = items.find(i => i.menu_item_id === rules.buy_item_id);
            if (!buyItem || buyItem.quantity < rules.buy_quantity) {
              isEligible = false;
              // Provide hint if they have the item but insufficient quantity
              if (buyItem) {
                const diffQty = rules.buy_quantity - buyItem.quantity;
                hints.push(`Add ${diffQty} more of the buy item to qualify for: "${promo.title}"`);
              }
            }
          } else {
            isEligible = false;
          }
          break;

        case PromotionType.COMBO_OFFER:
          if (rules?.combo_items && rules.combo_items.length > 0) {
            for (const combo of rules.combo_items) {
              const cartItem = items.find(i => i.menu_item_id === combo.menu_item_id);
              if (!cartItem || cartItem.quantity < combo.quantity) {
                isEligible = false;
              }
            }
          } else {
            isEligible = false;
          }
          break;

        case PromotionType.CATEGORY_PROMOTION:
          if (promo.category_id) {
            const hasCategoryItem = items.some(i => i.category_id === promo.category_id);
            if (!hasCategoryItem) {
              isEligible = false;
            }
          } else {
            isEligible = false;
          }
          break;

        case PromotionType.MENU_ITEM_PROMOTION:
          if (promo.menu_item_id) {
            const hasMenuItem = items.some(i => i.menu_item_id === promo.menu_item_id);
            if (!hasMenuItem) {
              isEligible = false;
            }
          } else {
            isEligible = false;
          }
          break;

        case PromotionType.FREE_DELIVERY:
          if (orderType !== OrderType.DELIVERY) {
            isEligible = false;
          }
          break;

        default:
          // Fallback to standard eligibility rules if defined
          if (rules) {
            if (rules.order_types && rules.order_types.length > 0 && !rules.order_types.includes(orderType)) {
              isEligible = false;
            }
            if (rules.min_order_amount && subtotal < rules.min_order_amount) {
              isEligible = false;
            }
          }
          break;
      }

      if (!isEligible) continue;

      // ─── PART B: REWARD CALCULATION ───
      let potentialDiscount = 0;
      const discountVal = reward?.discount_value || Number(promo.discount_value) || 0;

      switch (promo.reward_type) {
        case RewardType.PERCENTAGE_DISCOUNT:
          // Check if percentage applies globally or to a specific scope
          if (promo.menu_item_id) {
            // Apply only to that menu item
            const match = items.find(i => i.menu_item_id === promo.menu_item_id);
            if (match) {
              potentialDiscount = (match.unit_price * match.quantity) * (discountVal / 100);
            }
          } else if (promo.category_id) {
            // Apply to all items in that category
            const matchingCost = items
              .filter(i => i.category_id === promo.category_id)
              .reduce((sum, i) => sum + (i.unit_price * i.quantity), 0);
            potentialDiscount = matchingCost * (discountVal / 100);
          } else {
            // Apply to the entire subtotal
            potentialDiscount = subtotal * (discountVal / 100);
          }

          // Apply maximum discount cap
          if (reward?.max_discount_amount && potentialDiscount > reward.max_discount_amount) {
            potentialDiscount = reward.max_discount_amount;
          }
          break;

        case RewardType.FIXED_DISCOUNT:
          potentialDiscount = discountVal;
          break;

        case RewardType.FREE_ITEM:
        case RewardType.FREE_DRINK:
          const freeItemId = reward?.target_item_id || promo.menu_item_id;
          if (freeItemId) {
            const match = items.find(i => i.menu_item_id === freeItemId);
            if (match) {
              const freeQty = reward?.target_quantity || 1;
              potentialDiscount = match.unit_price * Math.min(match.quantity, freeQty);
            } else {
              hints.push(`Add the promotional reward item to your cart to get it free: "${promo.title}"`);
            }
          }
          break;

        case RewardType.FREE_DELIVERY:
          // Free delivery reward (we simulate with a flat delivery credit, e.g. $5.00, or the configured discount value)
          potentialDiscount = discountVal || 5.0;
          break;

        case RewardType.BOGO:
          const bogoItemId = reward?.target_item_id || promo.menu_item_id;
          if (bogoItemId) {
            const match = items.find(i => i.menu_item_id === bogoItemId);
            if (match) {
              if (match.quantity >= 2) {
                const numFree = Math.floor(match.quantity / 2);
                potentialDiscount = numFree * match.unit_price;
              } else {
                hints.push(`Add 1 more of this item to get it free: "${promo.title}"`);
              }
            }
          }
          break;

        case RewardType.COMBO_PRICE:
          // If combo offer matches, apply the difference between normal prices and special bundle combo price
          if (rules?.combo_items && rules.combo_items.length > 0 && reward?.combo_price) {
            let normalComboCost = 0;
            for (const combo of rules.combo_items) {
              const cartItem = items.find(i => i.menu_item_id === combo.menu_item_id);
              if (cartItem) {
                // Calculate normal price of 1 bundle
                normalComboCost += cartItem.unit_price * combo.quantity;
              }
            }
            if (normalComboCost > reward.combo_price) {
              potentialDiscount = normalComboCost - reward.combo_price;
            }
          }
          break;
      }

      // Safeguard: discount cannot exceed order subtotal
      if (potentialDiscount > subtotal) {
        potentialDiscount = subtotal;
      }

      if (potentialDiscount > bestDiscount) {
        bestDiscount = potentialDiscount;
        bestPromotionId = promo.id;
        bestPromotionTitle = promo.title;
      }
    }

    return {
      promotion_id: bestPromotionId,
      promotion_title: bestPromotionTitle,
      discount_amount: bestDiscount,
      hints: [...new Set(hints)]
    };
  }
}
