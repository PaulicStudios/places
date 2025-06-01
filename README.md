# Reviews MiniApp

If you have the World App you can try our Mini App here: 🌟 [REVIEWS](https://worldcoin.org/mini-app?app_id=app_23fd4240c950374e1cd8460e2593bd08&draft_id=meta_b6fbc66731112d4e9d9bbeaaa68ab71e&app_mode=mini-app) 🌟

**World ID powered review app for authentic human written reviews and ratings**

Review is a review and discovery platform built as a Worldcoin Mini App that leverages World ID authentication to create a trusted review ecosystem. Users can search for products by name or scan barcodes (supporting ISBN, UPC, and EAN formats) to instantly access product information and read or write verified reviews.

Review solves the problem of fake reviews and review spam by requiring World ID verification for all review submissions, ensuring each review comes from a real, unique human. Users can discover products through text search or by scanning physical product barcodes using their phone's camera, making it easy to review items while shopping or at home.

## 🌟 Features

- **🔐 World ID Authentication**: Every review is tied to a verified human identity, eliminating bots and fake accounts
- **📱 Universal Barcode Scanner**: Supports ISBN, UPC, and EAN formats with real-time product lookup
- **🔍 Product Discovery**: Search products by name with instant results and product images
- **⭐ Verified Reviews**: Leave ratings and reviews that other users can trust
- **📲 Mobile-First Design**: Optimized for mobile devices within the World App ecosystem
- **🚀 Real-time Product Lookup**: Automatic product information retrieval from external APIs
- **💾 Smart Caching**: Local database caching reduces API calls and improves performance

## 🚀 Getting Started
To run the Reviews MiniApp locally, follow these steps:
1. **Clone the repository**
1. **Install dependencies**:
   - Run `cd places && npm install`
1. **Create a World Mini App in the Worldcoin Developer Portal**
   - Select Mini-App & On-Chain
   - Set the URL to a tunneled local server (e.g., using `ngrok`)
1. **Create an account with Go-UPC**
   - Sign up at [Go-UPC](https://go-upc.com/)
   - Obtain your API key
1. **Set up environment variables**
   - Create a `.env.local` file in the `places` directory (see `.env.sample` for reference)
   - Add your Worldcoin Mini App credentials and API keys
1. **Deploy the smart contract:**
   - Sign up on [alchemy.com](https://alchemy.com) and create a new app to get your RPC URL
   - run `forge script script/Deploy.s.sol:DeployScript --rpc-url <URL> --broadcast` to deploy the smart contract
1. **Download the World App**
   - Install the [World App](https://worldcoin.org/world-app) on your mobile device
1. **Run the app**:
   - Scan the QR code in the World Developer Portal to open the Mini App in World App

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** with TypeScript
- **Worldcoin Mini Apps UI Kit** for design system compliance
- **Tailwind CSS** for responsive styling
- **ZXing library** for barcode scanning
- **iconoir-react** for consistent iconography

### Authentication & Identity
- **Worldcoin MiniSDK** (`@worldcoin/minikit-js` and `@worldcoin/minikit-react`)
- **NextAuth.js v5** for session management
- **World ID verification** for unique human authentication

### Backend & Database
- **Better-sqlite3** for local product caching and user data for MVP purposes
- **Go-UPC API** integration for product information lookup
- Custom search API endpoints for product discovery


## 📱 Usage

1. **Authenticate** with World ID in World App
2. **Search Products** by typing product names
3. **Scan Barcodes** using the camera scanner
4. **View Product Details** with images and descriptions
5. **Leave Reviews** with star ratings and comments
6. **Browse Reviews** from other verified users
