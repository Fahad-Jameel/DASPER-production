# Gemini API Key Loading Locations

This document shows all locations where the `GEMINI_API_KEY` is loaded from the `.env` file.

## Environment Variable Loading

### 1. Main Entry Point: `app.py`

**Line 20**: Import dotenv
```python
from dotenv import load_dotenv
```

**Line 65**: Load .env file
```python
load_dotenv()  # This loads all variables from .env file
```

**Line 279**: Get GEMINI_API_KEY in `init_cv_model()` function
```python
def init_cv_model():
    """Initialize CV Model"""
    try:
        api_key = os.getenv('GEMINI_API_KEY')  # ← Loads from .env
        if not api_key:
            logger.warning("⚠️ GEMINI_API_KEY not found in environment variables")
            return False
        
        genai.configure(api_key=api_key)
        logger.info("✅ Gemini AI configured successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Gemini AI initialization failed: {e}")
        return False
```

---

## Files Using GEMINI_API_KEY

### 2. `cv_building_analyzer.py`

**Line 73**: Load API key in `_initialize_cv_model()` method
```python
def _initialize_cv_model(self):
    """Initialize CV Model"""
    try:
        api_key = os.getenv('GEMINI_API_KEY')  # ← Loads from .env
        logger.info(f"🔍 Checking GEMINI_API_KEY: {'Found' if api_key else 'Not found'}")
        if not api_key:
            logger.warning("⚠️ GEMINI_API_KEY not found in environment variables")
            return False
        
        logger.info("🔧 Configuring CV Model API...")
        genai.configure(api_key=api_key)
        
        logger.info("🔧 Initializing CV model...")
        self.cv_model = genai.GenerativeModel('gemini-2.5-flash')
        logger.info("✅ CV Model initialized successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to initialize CV Model: {e}")
        return False
```

**Usage**: Building analysis, height/area estimation, cost estimation

---

### 3. `gemini_report_generator.py`

**Line 25**: Load API key in `_initialize_gemini()` method
```python
def _initialize_gemini(self):
    """Initialize Gemini API"""
    try:
        api_key = os.getenv('GEMINI_API_KEY')  # ← Loads from .env
        if not api_key:
            logger.warning("⚠️ GEMINI_API_KEY not found")
            return False
        
        genai.configure(api_key=api_key)
        self.gemini_model = genai.GenerativeModel('gemini-2.5-flash')
        logger.info("✅ Gemini report generator initialized")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to initialize Gemini: {e}")
        return False
```

**Usage**: AI-powered report generation

---

## Summary

### Environment Variable Loading Flow

```
1. app.py (line 65)
   └─ load_dotenv()  ← Loads .env file into environment
   
2. Files access the key:
   ├─ app.py (line 279)
   │  └─ os.getenv('GEMINI_API_KEY')
   │
   ├─ cv_building_analyzer.py (line 73)
   │  └─ os.getenv('GEMINI_API_KEY')
   │
   └─ gemini_report_generator.py (line 25)
      └─ os.getenv('GEMINI_API_KEY')
```

### .env File Format

The `.env` file should contain:
```env
GEMINI_API_KEY=your_actual_api_key_here
```

### Verification

To check if the key is loaded correctly, check the logs:
- ✅ `"✅ Gemini AI configured successfully"` - Key loaded
- ⚠️ `"⚠️ GEMINI_API_KEY not found"` - Key missing

---

## Files Summary

| File | Line | Function/Method | Purpose |
|------|------|----------------|---------|
| `app.py` | 65 | `load_dotenv()` | Loads .env file |
| `app.py` | 279 | `init_cv_model()` | Initialize Gemini for CV model |
| `cv_building_analyzer.py` | 73 | `_initialize_cv_model()` | Initialize for building analysis |
| `gemini_report_generator.py` | 25 | `_initialize_gemini()` | Initialize for report generation |

---

## Notes

- All files use `os.getenv('GEMINI_API_KEY')` to access the key
- The key must be set in the `.env` file in the backend directory
- `load_dotenv()` in `app.py` loads the .env file when the server starts
- If the key is not found, the system falls back to traditional methods

