import { relations } from "drizzle-orm/relations";
import {
  account,
  bodyProfile,
  creditTransaction,
  creditWallet,
  file,
  garment,
  lookbook,
  lookbookItem,
  payment,
  session,
  styleTip,
  tryOn,
  user,
} from "./schema";

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  payments: many(payment),
  bodyProfiles: many(bodyProfile),
  creditTransactions: many(creditTransaction),
  creditWallet: one(creditWallet, {
    fields: [user.id],
    references: [creditWallet.userId],
  }),
  tryOns: many(tryOn),
  lookbooks: many(lookbook),
  garments: many(garment),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const paymentRelations = relations(payment, ({ one, many }) => ({
  user: one(user, {
    fields: [payment.userId],
    references: [user.id],
  }),
  creditTransactions: many(creditTransaction),
}));

export const bodyProfileRelations = relations(bodyProfile, ({ one, many }) => ({
  user: one(user, {
    fields: [bodyProfile.userId],
    references: [user.id],
  }),
  photo: one(file, {
    fields: [bodyProfile.photoId],
    references: [file.id],
    relationName: "bodyProfile_photoId_file_id",
  }),
  enhancedPhoto: one(file, {
    fields: [bodyProfile.enhancedPhotoId],
    references: [file.id],
    relationName: "bodyProfile_enhancedPhotoId_file_id",
  }),
  tryOns: many(tryOn),
}));

export const fileRelations = relations(file, ({ many }) => ({
  bodyProfilePhotos: many(bodyProfile, {
    relationName: "bodyProfile_photoId_file_id",
  }),
  bodyProfileEnhancedPhotos: many(bodyProfile, {
    relationName: "bodyProfile_enhancedPhotoId_file_id",
  }),
  tryOnFrontPhotos: many(tryOn, {
    relationName: "tryOn_frontPhotoId_file_id",
  }),
  tryOnBackPhotos: many(tryOn, {
    relationName: "tryOn_backPhotoId_file_id",
  }),
  tryOnResults: many(tryOn, {
    relationName: "tryOn_resultId_file_id",
  }),
  lookbookCovers: many(lookbook),
  garmentMasks: many(garment, {
    relationName: "garment_maskId_file_id",
  }),
  garmentImages: many(garment, {
    relationName: "garment_imageId_file_id",
  }),
}));

export const creditTransactionRelations = relations(creditTransaction, ({ one }) => ({
  user: one(user, {
    fields: [creditTransaction.userId],
    references: [user.id],
  }),
  wallet: one(creditWallet, {
    fields: [creditTransaction.walletId],
    references: [creditWallet.id],
  }),
  payment: one(payment, {
    fields: [creditTransaction.paymentId],
    references: [payment.id],
  }),
  tryOn: one(tryOn, {
    fields: [creditTransaction.tryOnId],
    references: [tryOn.id],
  }),
}));

export const creditWalletRelations = relations(creditWallet, ({ one, many }) => ({
  transactions: many(creditTransaction),
  user: one(user, {
    fields: [creditWallet.userId],
    references: [user.id],
  }),
}));

export const tryOnRelations = relations(tryOn, ({ one, many }) => ({
  creditTransactions: many(creditTransaction),
  styleTips: many(styleTip),
  user: one(user, {
    fields: [tryOn.userId],
    references: [user.id],
  }),
  bodyProfile: one(bodyProfile, {
    fields: [tryOn.bodyProfileId],
    references: [bodyProfile.id],
  }),
  garment: one(garment, {
    fields: [tryOn.garmentId],
    references: [garment.id],
  }),
  frontPhoto: one(file, {
    fields: [tryOn.frontPhotoId],
    references: [file.id],
    relationName: "tryOn_frontPhotoId_file_id",
  }),
  backPhoto: one(file, {
    fields: [tryOn.backPhotoId],
    references: [file.id],
    relationName: "tryOn_backPhotoId_file_id",
  }),
  result: one(file, {
    fields: [tryOn.resultId],
    references: [file.id],
    relationName: "tryOn_resultId_file_id",
  }),
  lookbookItems: many(lookbookItem),
}));

export const styleTipRelations = relations(styleTip, ({ one }) => ({
  tryOn: one(tryOn, {
    fields: [styleTip.tryOnId],
    references: [tryOn.id],
  }),
}));

export const garmentRelations = relations(garment, ({ one, many }) => ({
  tryOns: many(tryOn),
  user: one(user, {
    fields: [garment.userId],
    references: [user.id],
  }),
  mask: one(file, {
    fields: [garment.maskId],
    references: [file.id],
    relationName: "garment_maskId_file_id",
  }),
  image: one(file, {
    fields: [garment.imageId],
    references: [file.id],
    relationName: "garment_imageId_file_id",
  }),
}));

export const lookbookItemRelations = relations(lookbookItem, ({ one }) => ({
  lookbook: one(lookbook, {
    fields: [lookbookItem.lookbookId],
    references: [lookbook.id],
  }),
  tryOn: one(tryOn, {
    fields: [lookbookItem.tryOnId],
    references: [tryOn.id],
  }),
}));

export const lookbookRelations = relations(lookbook, ({ one, many }) => ({
  items: many(lookbookItem),
  user: one(user, {
    fields: [lookbook.userId],
    references: [user.id],
  }),
  cover: one(file, {
    fields: [lookbook.coverId],
    references: [file.id],
  }),
}));
