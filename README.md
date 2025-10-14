# Pinterest Scraper - Full Stack Application

A powerful Pinterest image scraper with a beautiful Next.js frontend and .NET backend.

## 🚀 Features

- **Batch Scraping**: Scrape 20 high-quality (1080p+) images for multiple queries at once
- **Smart Extension**: Add custom text (like "lapland" or "winter") to all queries
- **Local Download**: Automatically downloads images to avoid Pinterest's access restrictions
- **Beautiful UI**: Modern gradient design with loading states and organized results
- **Horizontal Scrolling**: Images displayed horizontally per query section
- **Image Modal**: Click any image for full-size view with details
- **Real-time Progress**: See loading status while scraping

## 📁 Project Structure

```
PintrestScraper/
├── TravlprepTools.API.Scraper/        # .NET 9.0 Web API
│   ├── Controllers/
│   ├── Services/
│   ├── Infrastructure/
│   └── downloaded_images/              # Auto-downloaded images
└── TravlprepTools.Frontend.Scraper/   # Next.js 15 Frontend
    └── app/
        └── src/
            ├── app/
            └── components/
```

## 🛠️ Tech Stack

**Backend:**
- .NET 9.0
- PuppeteerSharp (Browser automation)
- Swashbuckle (Swagger UI)

**Frontend:**
- Next.js 15.5.5 (React 19)
- Tailwind CSS 4
- Turbopack

## 📦 Installation & Setup

### 1. Backend Setup (.NET API)

```bash
cd TravlprepTools.API.Scraper

# Build the project
dotnet build

# Run the API (starts on http://localhost:5228)
dotnet run
```

The API will:
- Download Chromium automatically on first run
- Start Swagger UI at http://localhost:5228
- Listen for requests from the frontend

### 2. Frontend Setup (Next.js)

```bash
cd TravlprepTools.Frontend.Scraper/app

# Install dependencies (if not already done)
npm install

# Run development server (starts on http://localhost:3000)
npm run dev
```

## 🎯 How to Use

1. **Start Both Servers:**
   - Terminal 1: Run the .NET API (`cd TravlprepTools.API.Scraper && dotnet run`)
   - Terminal 2: Run Next.js frontend (`cd TravlprepTools.Frontend.Scraper/app && npm run dev`)

2. **Open Frontend:**
   - Navigate to http://localhost:3000

3. **Enter Activities:**
   ```
   Snow mobile safari
   Santa Claus village
   Huski sleigh
   Northern lights observation
   Glass igloo hotel
   ```

4. **Add Extension (Optional):**
   - Type "lapland" or "arctic finland" to add to each query

5. **Click "🔍 Scrape Images"**
   - Watch the loading animation
   - Results appear organized by query
   - Scroll horizontally through images
   - Click any image for full view

## 🔧 Configuration

### API Configuration
Edit `TravlprepTools.API.Scraper/appsettings.json`:
```json
{
  "ImageDownloadPath": "downloaded_images"
}
```

### Frontend Configuration
The API URL defaults to `http://localhost:5228`.
To change it, create `.env.local` in the frontend app folder:
```env
NEXT_PUBLIC_API_URL=http://localhost:5228
```

## 📡 API Endpoints

### Swagger UI
- **URL**: http://localhost:5228
- Interactive API documentation

### Main Endpoint
```
POST /api/scraper/pinterest/batch/text
Content-Type: text/plain
Query Params: ?extension=lapland&count=20&downloadImages=true

Body:
Snow mobile safari
Santa Claus village
Glass igloo hotel
```

## 🎨 Features Breakdown

### Backend Features:
- ✅ Plain text input (no JSON required!)
- ✅ Batch processing up to 50 queries
- ✅ High-quality image filtering (1080p+)
- ✅ Automatic image download with proper headers
- ✅ CORS enabled for frontend
- ✅ Progress logging
- ✅ Error handling per query

### Frontend Features:
- ✅ Modern gradient design
- ✅ Dark mode support
- ✅ Loading animations
- ✅ Horizontal image scrolling
- ✅ Image modal with details
- ✅ Responsive layout
- ✅ Error handling
- ✅ Query-organized sections

## 🐛 Troubleshooting

**"Access Denied" errors on images?**
- Make sure `downloadImages=true` is set (default)
- Images are saved to `downloaded_images/` folder

**Frontend can't connect to API?**
- Verify API is running on http://localhost:5228
- Check CORS settings in `Program.cs`
- Ensure ports aren't blocked by firewall

**Chromium not downloading?**
- First run may take a few minutes
- Check internet connection
- Logs will show download progress

## 📊 Performance

- **Images per Query**: 20 (configurable up to 100)
- **Image Quality**: 1080p+ originals only
- **Processing Time**: ~30-60 seconds for 13 queries
- **Download Size**: Varies by image, typically 100-500KB each

## 🎉 Example Output

For a query like "Snow mobile safari lapland":
- 20 high-quality images
- Organized in a horizontal scrollable section
- Title shows the query
- Each image shows dimensions and quality
- Click to view full size

## 📝 Notes

- Images are automatically downloaded to avoid Pinterest CDN restrictions
- The scraper respects rate limits with 2-second delays between queries
- All images are original quality from Pinterest
- Downloaded images are named: `{query}_{index}_{timestamp}.jpg`

## 🚀 Deployment

### Backend:
```bash
dotnet publish -c Release
# Deploy to your hosting service
```

### Frontend:
```bash
npm run build
npm start
# Or deploy to Vercel/Netlify
```

## 📄 License

Private project for TravlprepTools

---

Built with ❤️ using .NET 9 and Next.js 15

