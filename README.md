# 🌾 CropSafe — AI-Powered Crop Disease Detection & Early Warning System

CropSafe is an AI-powered web platform designed to help Indian farmers detect crop diseases early, monitor weather conditions, and receive timely, location-specific agricultural warnings. It combines image-based disease detection, weather-driven risk assessment, interactive maps, and a bilingual voice assistant to make agricultural information more accessible.

Built with **React, TypeScript, FastAPI, Google Gemini AI, and Open-Meteo**, CropSafe aims to support farmers in making informed decisions about crop health and disease prevention.

## ✨ Features

### 🔬 1. AI-Powered Crop Disease Detection

* Upload or capture images of wheat and rice crops.
* Analyze crop images using Google Gemini AI.
* Identify potential crop diseases and provide AI-generated explanations.
* Assess disease severity using Low, Medium, High, and Very High levels.
* Display results through an intuitive interface.

### 🌦️ 2. Weather-Based Early Warning System

* Retrieve weather forecasts using the Open-Meteo API.
* Support location-based weather monitoring.
* Assess disease risk using factors such as temperature, humidity, and rainfall.
* Generate risk levels and color-coded early warnings.
* Help farmers anticipate potentially favorable conditions for disease development.

### 🗺️ 3. Interactive Map

* Explore agricultural locations through an interactive map.
* View location-based information and weather-related risk data.
* Support geographical awareness of crop disease threats.

### 📋 4. Farmer History

* Access previous disease prediction records.
* Review past crop health assessments.
* Keep track of earlier predictions for easier reference.

### 🔔 5. Alert and Notification System

* Provide alerts for relevant agricultural risks.
* Support timely communication of important warnings.
* Help farmers stay informed about potential crop threats.

### 🎙️ 6. Bilingual Voice Assistant

* Support voice interaction in Hindi and English.
* Use browser-based speech recognition and speech synthesis.
* Allow farmers to ask questions and receive spoken responses.
* Improve accessibility for users who prefer voice-based interaction.

### 🌐 7. Bilingual User Interface

* Switch between English and Hindi.
* Provide an accessible interface for Indian farmers.
* Make essential crop health and weather information easier to understand.

### 👤 8. Farmer Login

* Provide a dedicated login interface for farmers.
* Support a more personalized user experience.

## 🛠️ Technology Stack

### Frontend

| Technology              | Purpose                                |
| ----------------------- | -------------------------------------- |
| React                   | User interface                         |
| TypeScript              | Type-safe application development      |
| Material UI             | UI components and styling              |
| React Router            | Client-side navigation                 |
| Axios                   | API communication                      |
| Leaflet & React-Leaflet | Interactive maps                       |
| Web Speech API          | Voice recognition and speech synthesis |

### Backend

| Technology        | Purpose                                   |
| ----------------- | ----------------------------------------- |
| Python            | Backend development                       |
| FastAPI           | REST API framework                        |
| Uvicorn           | ASGI server                               |
| Google Gemini API | AI-powered crop image analysis            |
| Pillow            | Image processing                          |
| OpenCV            | Image processing and computer vision      |
| Open-Meteo API    | Weather forecasts and meteorological data |

### Tools and Services

* Git and GitHub — version control and source code management
* Node.js and npm — frontend development and dependency management
* Vercel — frontend deployment configuration
* Environment variables — API key and configuration management

## 🏗️ System Architecture

```text
                  ┌──────────────────────┐
                  │      Farmer          │
                  └──────────┬───────────┘
                             │
                  ┌──────────▼───────────┐
                  │   React + TypeScript │
                  │     Web Frontend     │
                  └──────────┬───────────┘
                             │
                  ┌──────────▼───────────┐
                  │      FastAPI         │
                  │       Backend        │
                  └─────┬───────┬────────┘
                        │       │
             ┌──────────▼─┐   ┌─▼────────────────┐
             │ Gemini AI  │   │  Open-Meteo API  │
             │ Disease   │   │ Weather Forecast │
             │ Analysis  │   │ & Risk Assessment│
             └────────────┘   └──────────────────┘
```

## 🚀 Getting Started

Follow these instructions to run CropSafe locally.

### Prerequisites

Install the following before starting:

* Python 3.8 or later (use a version compatible with your dependencies)
* Node.js and npm
* Git
* A Google Gemini API key

### 1. Clone the Repository

```bash
git clone https://github.com/Anshu-112/CropSafe.git
cd CropSafe
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

On macOS or Linux:

```bash
source .venv/bin/activate
```

Install the required Python packages:

```bash
pip install -r requirements.txt
```

Configure the required environment variables. Create a `.env` file in the backend directory if your application expects it.

Example:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Replace the placeholder with your actual API key. Use the exact environment variable name expected by your application.

Start the backend:

```bash
python main.py
```

If your application uses Uvicorn directly, you can alternatively start it with:

```bash
uvicorn main:app --reload
```

The API will typically be available at:

* API base URL: `http://127.0.0.1:8000`
* Interactive API documentation: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup

Open a new terminal from the project root and navigate to the frontend:

```bash
cd frontend/cropsafe-web
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm start
```

The frontend will typically run at:

`http://localhost:3000`

If your frontend uses a different development command, follow the scripts defined in `frontend/cropsafe-web/package.json`.

## ⚙️ Environment Configuration

CropSafe may require environment variables for API keys, backend URLs, and other deployment settings.

Example backend configuration:

```env
GEMINI_API_KEY=your_gemini_api_key
```

For the frontend, configure the backend API URL according to the environment and the variable naming convention used by your React application.

**Security note:** Never commit real API keys, passwords, tokens, or private environment files to GitHub. Keep secrets in `.env` files locally and configure them securely in your deployment environment.

## 📁 Project Structure

```text
CropSafe/
├── backend/
│   ├── api/
│   │   ├── prediction_routes.py
│   │   ├── history_routes.py
│   │   └── map_routes.py
│   ├── database/
│   │   └── db.py
│   ├── services/
│   │   ├── weather_service.py
│   │   └── alert_dispatcher.py
│   ├── main.py
│   ├── requirements.txt
│   ├── Procfile
│   └── seed_gujarat_reports.py
│
├── frontend/
│   └── cropsafe-web/
│       ├── public/
│       ├── src/
│       │   ├── context/
│       │   ├── pages/
│       │   │   ├── HomePage.tsx
│       │   │   ├── PredictPage.tsx
│       │   │   ├── EarlyWarningPage.tsx
│       │   │   ├── VoicePage.tsx
│       │   │   ├── HistoryPage.tsx
│       │   │   ├── MapPage.tsx
│       │   │   └── LoginPage.tsx
│       │   ├── services/
│       │   │   └── api.ts
│       │   ├── App.tsx
│       │   └── index.css
│       ├── package.json
│       └── vercel.json
│
└── README.md
```

*Note: This structure highlights the main files and features. Additional files, configuration, and model assets may exist in the repository.*

## 🧪 Testing

The backend includes tests for selected features, such as alert dispatching, history APIs, and map APIs.

Run the tests from the backend directory:

```bash
pytest
```

If pytest is not installed in your environment:

```bash
pip install pytest
```

## 🚢 Deployment

CropSafe is structured to support separate frontend and backend deployments.

### Frontend

* Deploy the React application using Vercel or another compatible hosting provider.
* Configure the production backend API URL.
* Ensure client-side routes are configured correctly for direct navigation.

### Backend

* Deploy the FastAPI application to a Python-compatible hosting provider.
* Configure the required environment variables in the hosting dashboard.
* Ensure the frontend's deployed domain is permitted by the backend's CORS configuration.
* Verify that external API integrations are configured correctly.

Deployment settings may vary depending on the hosting providers and the configuration in the repository.

## 🔮 Future Improvements

* Expand disease detection to additional crops.
* Improve prediction accuracy using validated agricultural datasets.
* Add more regional languages.
* Introduce richer farmer dashboards and historical analytics.
* Enhance location-specific outbreak monitoring.
* Integrate additional agricultural advisory resources.

## 🤝 Contributing

Contributions, bug reports, feature requests, and suggestions are welcome!

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push the branch to your fork.
5. Open a pull request.

## ⚠️ Disclaimer

CropSafe provides AI-generated crop disease assessments and weather-based risk indicators for informational purposes. Predictions may not always be accurate and should not replace professional agricultural advice or laboratory diagnosis. Farmers should consult qualified agricultural experts when making important crop treatment decisions.

## 👩‍💻 Author

**Anshu Varma**
BTech Computer Science Student | AI & Software Development

GitHub: [Anshu-112](https://github.com/Anshu-112)

---

*Built with the goal of making AI-powered agricultural support more accessible to Indian farmers.* 🌱
