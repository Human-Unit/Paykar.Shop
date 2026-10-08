# My Shopping demo for your own browser

This setup adds five clearly named demo templates using real available catalog
products and links five existing local test orders into your browser's history.
It creates no database records and does not change cart, language, or theme.
Order cards use the existing orders' real contents; four of these orders have
only one product. The templates contain several products for overlapping images.

1. Open `http://localhost:3000/my-shopping` in your normal Chrome profile.
2. Copy the seed script using PowerShell:

   ```powershell
   Get-Content -Raw -Encoding UTF8 'D:\Workshop\Paykar\Test_Task_Paykar_Shop-main\tools\demo-session\seed-my-shopping.js' | Set-Clipboard
   ```

3. Press F12, select Console, paste the script, and press Enter.
   The page updates immediately. This seeds that browser profile only and
   survives a reload. The API on localhost:8080 must be running.

Existing templates/history are kept. Rerunning does not duplicate demo entries.
The first run backs up the two original My Shopping storage values. No server
rebuild is needed because these scripts operate on browser data, not app code.

To undo, copy and run `restore-my-shopping.js` in the same profile/Console.
Restoring returns templates/history to the first backup, including undoing any
template/history edits made after that backup. The cart remains unchanged.

These scripts are for this local development database. If the saved test order
IDs no longer exist, seeding fails before writing shopping data. Do not use
them against production or another person's browser profile.
