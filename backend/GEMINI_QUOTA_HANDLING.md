# Gemini API Quota Handling

## Issue
Gemini API free tier has a limit of **20 requests per day per project per model**. When this limit is exceeded, the API returns a 429 error.

## Solution Implemented

### 1. Quota Detection
- Detects 429 errors and quota-related messages
- Sets `quota_exceeded` flag to prevent further API calls
- Logs warning messages instead of errors

### 2. Graceful Fallback
- When quota is exceeded, system automatically falls back to:
  - Traditional building analysis methods
  - Default regional costs
  - Default repair time estimates
  - Traditional cost estimation

### 3. Methods Updated
- ✅ `_analyze_with_cv_vision()` - Building analysis
- ✅ `estimate_cost_with_cv_model()` - Cost estimation
- ✅ `_research_regional_costs()` - Regional cost research
- ✅ `_estimate_repair_time()` - Repair time estimation

## Behavior

### Before Quota Exceeded
- System uses Gemini API for enhanced analysis
- Provides AI-powered building dimension estimation
- Uses AI for cost estimation

### After Quota Exceeded
- System automatically detects quota limit
- Switches to fallback methods
- Continues to function normally
- No errors shown to users

## Log Messages

### When Quota Exceeded
```
⚠️ Gemini API quota exceeded. Skipping API call, using fallback.
⚠️ Quota error details: 429 You exceeded your current quota...
```

### Fallback Messages
```
⚠️ Gemini API quota exceeded. Using default regional costs.
⚠️ Gemini API quota exceeded. Using default repair time.
```

## Recommendations

1. **Upgrade API Plan**: Consider upgrading to paid tier for higher limits
2. **Cache Results**: Implement caching to reduce API calls
3. **Batch Processing**: Group multiple requests when possible
4. **Rate Limiting**: Implement client-side rate limiting

## Current Status

- ✅ Quota detection implemented
- ✅ Graceful fallback working
- ✅ System continues to function
- ✅ No user-facing errors

The system will automatically recover when the quota resets (daily limit).

