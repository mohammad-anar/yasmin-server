// // src/app/modules/integration/appleValidator.ts
// import { verifyAppleReceipt } from "node-apple-receipt-verify";
// import config from "../../../config/index.js";
// 
// export async function validateAppleReceipt(receipt: string) {
//   const result = await verifyAppleReceipt({
//     password: (config as any).apple_shared_secret,
//     receiptData: receipt,
//     isTestEnvironment: config.node_env !== "production",
//   });
//   return result;
// }

