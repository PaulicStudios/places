# Reviews MiniApp

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

## 🐛 Issues & Support

If you encounter any issues or have questions:
1. Check the [Issues](../../issues) page
2. Review the [Worldcoin Mini Apps documentation](https://docs.worldcoin.org/mini-apps)
3. Create a new issue with detailed information

<br>
<br>

---

Built with ❤️ for the Worldcoin ecosystem
