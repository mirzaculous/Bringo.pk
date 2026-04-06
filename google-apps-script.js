/**
 * BRINGO.PK — Google Apps Script Backend
 * =======================================
 * This script receives form submissions from the Bringo.pk website
 * and stores them in Google Sheets.
 *
 * SETUP:
 * 1. Go to https://sheets.google.com and create a new spreadsheet
 * 2. Name it: "Bringo.pk Orders"
 * 3. Create two sheets (tabs):
 *    - "Grocery Orders"
 *    - "Clothing Orders"
 * 4. Open Extensions > Apps Script
 * 5. Paste this entire file into the editor
 * 6. Save, then click Deploy > New Deployment
 * 7. Type: Web App | Execute as: Me | Access: Anyone
 * 8. Copy the Web App URL and paste it in app.js (GOOGLE_SCRIPT_URL)
 */

// ── SPREADSHEET CONFIG ──────────────────────────────────────────────
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE"; // Replace with your Google Sheets ID
// (Get it from the URL: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit)

const GROCERY_SHEET = "Grocery Orders";
const CLOTHING_SHEET = "Clothing Orders";

// ── CORS HEADERS ────────────────────────────────────────────────────
function setCorsHeaders(output) {
  output.setHeader("Access-Control-Allow-Origin", "*");
  output.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  output.setHeader("Access-Control-Allow-Headers", "Content-Type");
  return output;
}

// ── HANDLE OPTIONS (preflight) ──────────────────────────────────────
function doOptions(e) {
  return setCorsHeaders(ContentService.createTextOutput(""));
}

// ── MAIN POST HANDLER ───────────────────────────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (data.type === "grocery") {
      appendGroceryOrder(ss, data);
    } else if (data.type === "clothing") {
      appendClothingOrder(ss, data);
    }

    const output = ContentService
      .createTextOutput(JSON.stringify({ success: true, message: "Order received" }))
      .setMimeType(ContentService.MimeType.JSON);
    return setCorsHeaders(output);

  } catch (error) {
    const output = ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
    return setCorsHeaders(output);
  }
}

// ── GROCERY ORDER ───────────────────────────────────────────────────
function appendGroceryOrder(ss, data) {
  let sheet = ss.getSheetByName(GROCERY_SHEET);

  // Create sheet and headers if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(GROCERY_SHEET);
    sheet.appendRow([
      "Timestamp", "Full Name", "Phone", "Address",
      "Items Requested", "Weight", "Quantity", "Status"
    ]);
    // Style headers
    const header = sheet.getRange(1, 1, 1, 8);
    header.setBackground("#00A651").setFontColor("white").setFontWeight("bold");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(5, 300); // Items column wider
    sheet.setColumnWidth(7, 200); // Address column wider
  }

  sheet.appendRow([
    data.timestamp,
    data.fullName,
    data.phone,
    data.address,
    data.items,
    data.weight || "Not specified",
    data.quantity,
    "New" // Default status
  ]);

  // Auto-resize columns
  sheet.autoResizeColumns(1, 8);
}

// ── CLOTHING ORDER ──────────────────────────────────────────────────
function appendClothingOrder(ss, data) {
  let sheet = ss.getSheetByName(CLOTHING_SHEET);

  // Create sheet and headers if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(CLOTHING_SHEET);
    sheet.appendRow([
      "Timestamp", "Full Name", "Phone", "Address",
      "Brand", "Product Code", "Color", "Size", "Quantity",
      "Image Name", "Status"
    ]);
    // Style headers
    const header = sheet.getRange(1, 1, 1, 11);
    header.setBackground("#1a1a2e").setFontColor("white").setFontWeight("bold");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(4, 220); // Address wider
    sheet.setColumnWidth(6, 200); // Product code wider
  }

  sheet.appendRow([
    data.timestamp,
    data.fullName,
    data.phone,
    data.address,
    data.brand,
    data.productCode,
    data.color,
    data.size,
    data.quantity,
    data.imageName || "No image",
    "New" // Default status
  ]);

  sheet.autoResizeColumns(1, 11);

  // If image was uploaded, save it to Drive (optional, can be commented out)
  if (data.imageData) {
    try {
      saveImageToDrive(data);
    } catch (imgErr) {
      // Image save failed, but order was still recorded
      console.log("Image save failed: " + imgErr.message);
    }
  }
}

// ── SAVE IMAGE TO GOOGLE DRIVE ──────────────────────────────────────
function saveImageToDrive(data) {
  // Create or get a "Bringo Orders" folder in Drive
  let folder;
  const folders = DriveApp.getFoldersByName("Bringo Orders - Clothing Images");
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder("Bringo Orders - Clothing Images");
  }

  // Decode base64 and create file
  const decoded = Utilities.base64Decode(data.imageData);
  const blob = Utilities.newBlob(decoded, "image/jpeg", data.imageName || "order_image.jpg");
  const file = folder.createFile(blob);
  file.setName(`${data.timestamp}_${data.fullName}_${data.brand}_${data.imageName}`);
}

// ── TEST FUNCTION (run this to test the script) ──────────────────────
function testGrocerySubmission() {
  const testData = {
    type: "grocery",
    timestamp: new Date().toLocaleString(),
    items: "2x Nestle Milk 1L, 500g Chicken",
    weight: "2 kg",
    quantity: "3",
    fullName: "Test Customer",
    phone: "03001234567",
    address: "House 12, Block A, DHA Karachi"
  };

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  appendGroceryOrder(ss, testData);
  Logger.log("Test grocery order added successfully!");
}

function testClothingSubmission() {
  const testData = {
    type: "clothing",
    timestamp: new Date().toLocaleString(),
    brand: "Khaadi",
    productCode: "KE-2401",
    color: "Navy Blue",
    size: "M",
    quantity: "1",
    imageName: "product.jpg",
    imageData: null,
    fullName: "Test Customer",
    phone: "03001234567",
    address: "House 12, Block A, DHA Karachi"
  };

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  appendClothingOrder(ss, testData);
  Logger.log("Test clothing order added successfully!");
}
