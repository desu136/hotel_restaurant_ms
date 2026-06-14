"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
var client_1 = require("@prisma/client");
var bcrypt_1 = require("bcrypt");
var prisma = new client_1.PrismaClient({
    log: ['info', 'query', 'error', 'warn']
});
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var superAdminRole, systemTenant, adminEmail, adminPassword, adminUser, plansCount;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Starting database seeding...");
                    // 1. Create Default Roles
                    console.log("Seeding roles...");
                    return [4 /*yield*/, prisma.role.upsert({
                            where: { code: 'SUPER_ADMIN' },
                            update: {},
                            create: {
                                code: 'SUPER_ADMIN',
                                name: 'Super Administrator',
                            },
                        })];
                case 1:
                    superAdminRole = _a.sent();
                    return [4 /*yield*/, prisma.role.upsert({
                            where: { code: 'TENANT_ADMIN' },
                            update: {},
                            create: {
                                code: 'TENANT_ADMIN',
                                name: 'Tenant Administrator',
                            },
                        })
                        // 2. Create the SYSTEM Tenant
                    ];
                case 2:
                    _a.sent();
                    // 2. Create the SYSTEM Tenant
                    console.log("Seeding SYSTEM tenant...");
                    return [4 /*yield*/, prisma.tenant.findFirst({
                            where: { business_name: 'System Admin' }
                        })];
                case 3:
                    systemTenant = _a.sent();
                    if (!!systemTenant) return [3 /*break*/, 5];
                    return [4 /*yield*/, prisma.tenant.create({
                            data: {
                                business_name: 'System Admin',
                                owner_name: 'System',
                                phone: '0000000000',
                                email: 'system@hospitalityhub.com',
                                business_type: 'HOTEL_RESTAURANT',
                                status: 'ACTIVE',
                            }
                        })];
                case 4:
                    systemTenant = _a.sent();
                    _a.label = 5;
                case 5:
                    // 3. Create Default Super Admin User
                    console.log("Seeding SUPER_ADMIN user...");
                    adminEmail = 'admin@hospitalityhub.com';
                    return [4 /*yield*/, (0, bcrypt_1.hash)('admin123', 10)];
                case 6:
                    adminPassword = _a.sent();
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: adminEmail },
                            update: {}, // Don't overwrite password if already set
                            create: {
                                email: adminEmail,
                                full_name: 'Super Admin',
                                password_hash: adminPassword,
                                tenant_id: systemTenant.id,
                                status: 'ACTIVE',
                                roles: {
                                    create: {
                                        role_id: superAdminRole.id
                                    }
                                }
                            },
                        })
                        // 4. Create Default Subscription Plans (if not exist)
                    ];
                case 7:
                    adminUser = _a.sent();
                    // 4. Create Default Subscription Plans (if not exist)
                    console.log("Seeding default subscription plans...");
                    return [4 /*yield*/, prisma.subscriptionPlan.count()];
                case 8:
                    plansCount = _a.sent();
                    if (!(plansCount === 0)) return [3 /*break*/, 10];
                    return [4 /*yield*/, prisma.subscriptionPlan.createMany({
                            data: [
                                { name: 'Trial Plan', monthly_price: 0, annual_price: 0, trial_days: 14 },
                                { name: 'Basic', monthly_price: 49.99, annual_price: 499.99, trial_days: 0 },
                                { name: 'Pro', monthly_price: 99.99, annual_price: 999.99, trial_days: 0 }
                            ]
                        })];
                case 9:
                    _a.sent();
                    _a.label = 10;
                case 10:
                    console.log("✅ Seeding complete!");
                    console.log("\nSuper Admin Login:\nEmail: ".concat(adminEmail, "\nPassword: admin123\n"));
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
