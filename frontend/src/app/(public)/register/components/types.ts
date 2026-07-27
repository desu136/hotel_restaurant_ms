export interface RegisterFormData {
  businessName: string;
  businessType: string;
  ownerName: string;
  email: string;
  phone: string;
  password: string;
}

export type SlideVariants = {
  enter: (direction: number) => { x: number; opacity: number };
  center: { zIndex: number; x: number; opacity: number };
  exit: (direction: number) => { zIndex: number; x: number; opacity: number };
};
