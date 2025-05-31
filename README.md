# Reviews

**Worldcoin-powered product review app with barcode scanning for authenticated reviews and ratings**

A product review and discovery platform built as a Worldcoin Mini App that leverages World ID authentication to create a trusted review ecosystem. Users can search for products by name or scan barcodes to instantly access product information and leave verified reviews.

## 🌟 Features

- **🔐 World ID Authentication**: Every review is tied to a verified human identity, eliminating bots and fake accounts
- **📱 Universal Barcode Scanner**: Supports ISBN, UPC, and EAN formats with real-time product lookup
- **🔍 Product Discovery**: Search products by name with instant results and product images
- **⭐ Verified Reviews**: Leave ratings and reviews that other users can trust
- **📲 Mobile-First Design**: Optimized for mobile devices within the World App ecosystem
- **🚀 Real-time Product Lookup**: Automatic product information retrieval from external APIs
- **💾 Smart Caching**: Local database caching reduces API calls and improves performance

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** with TypeScript
- **Worldcoin Mini Apps UI Kit** for design system compliance
- **Tailwind CSS** for responsive styling
- **@zxing/library** for barcode scanning
- **iconoir-react** for consistent iconography

### Authentication & Identity
- **Worldcoin MiniSDK** (`@worldcoin/minikit-js` and `@worldcoin/minikit-react`)
- **NextAuth.js v5** for session management
- **World ID verification** for unique human authentication

### Backend & Database
- **Better-sqlite3** for local product caching and user data
- **Go-UPC API** integration for product information lookup
- Custom search API endpoints for product discovery

### Key Technical Features
- **Cross-platform barcode scanning** within MiniSDK constraints
- **Smart camera selection** (prioritizes rear cameras for scanning)
- **Progressive loading states** with skeleton components
- **Hybrid search system** (local DB + external API fallback)
- **Error handling and fallbacks** for camera access and network issues

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- World App for testing
- Go-UPC API key (for product lookups)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd places
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Follow the instructions in the `.env.local` file to configure:
   - World ID app credentials
   - Go-UPC API key
   - NextAuth configuration

4. **Generate auth secret**
   ```bash
   npx auth secret
   ```
   Update the `AUTH_SECRET` in your `.env.local` file

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Set up ngrok for testing**
   ```bash
   ngrok http 3000
   ```

7. **Configure your app**
   - Add your ngrok domain to `allowedDevOrigins` in `next.config.ts`
   - Update `AUTH_URL` in `.env.local` to your ngrok URL
   - Configure your app at [developer.worldcoin.org](https://developer.worldcoin.org)

## 📱 Usage

### For Users
1. **Authenticate** with World ID in World App
2. **Search Products** by typing product names
3. **Scan Barcodes** using the camera scanner
4. **View Product Details** with images and descriptions
5. **Leave Reviews** with star ratings and comments
6. **Browse Reviews** from other verified users

### For Developers
- The app follows Worldcoin's Mini App design guidelines
- Barcode scanner supports ISBN, UPC, EAN formats
- Product data is cached locally and synced with Go-UPC API
- All reviews require World ID verification

## 🔧 Configuration

### Environment Variables
```env
# World ID Configuration
NEXT_PUBLIC_WLD_APP_ID=your_app_id
NEXT_PUBLIC_WLD_ACTION_ID=your_action_id

# Go-UPC API
BARCODE_API_KEY=your_go_upc_api_key

# NextAuth
AUTH_SECRET=your_generated_secret
AUTH_URL=your_app_url

# Database
DATABASE_URL=./reviews.db
```

### World App Setup
1. Create a new Mini App at [developer.worldcoin.org](https://developer.worldcoin.org)
2. Configure your app domain and permissions
3. Set up World ID verification actions
4. Add camera permissions for barcode scanning

## 🏗️ Project Structure
src/
├── app/
│ ├── (protected)/ # Authenticated routes
│ │ └── home/
│ │ ├── scanner/ # Barcode scanner page
│ │ └── product-demo/ # Product details
│ ├── api/
│ │ ├── search/ # Product search API
│ │ └── auth/ # Authentication routes
│ └── page.tsx # Landing page
├── components/
│ ├── BarcodeScanner/ # Camera-based barcode scanner
│ ├── ProductSearch/ # Text-based product search
│ ├── ProductCard/ # Product display components
│ └── Reviews/ # Review components
└── lib/
├── db.ts # Database operations
└── auth.ts # Authentication config

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Worldcoin](https://worldcoin.org) for the Mini App platform and World ID
- [Mini Apps UI Kit](https://github.com/worldcoin/mini-apps-ui-kit) for design components
- [ZXing](https://github.com/zxing-js/library) for barcode scanning capabilities
- [Go-UPC](https://go-upc.com) for product information API
- [supercorp-ai](https://github.com/supercorp-ai) team for the initial template

## 🐛 Issues & Support

If you encounter any issues or have questions:
1. Check the [Issues](../../issues) page
2. Review the [Worldcoin Mini Apps documentation](https://docs.worldcoin.org/mini-apps)
3. Create a new issue with detailed information

---

Built with ❤️ for the Worldcoin ecosystem
