import type * as s from "@/db/schema";

export type User = typeof s.user.$inferSelect;
export type Session = typeof s.session.$inferSelect;
export type Account = typeof s.account.$inferSelect;
export type Verification = typeof s.verification.$inferSelect;
export type Todo = typeof s.todo.$inferSelect;
export type File = typeof s.file.$inferSelect;
export type BodyProfile = typeof s.bodyProfile.$inferSelect;
export type Garment = typeof s.garment.$inferSelect;
export type TryOn = typeof s.tryOn.$inferSelect;
export type Lookbook = typeof s.lookbook.$inferSelect;
export type LookbookItem = typeof s.lookbookItem.$inferSelect;
export type StyleTip = typeof s.styleTip.$inferSelect;
export type CreditWallet = typeof s.creditWallet.$inferSelect;
export type Payment = typeof s.payment.$inferSelect;
export type CreditTransaction = typeof s.creditTransaction.$inferSelect;
