# Sahayak AI Authentication Fix

## 🐛 Problem

When users tried to ask questions to Sahayak AI, they received an error:
```
Authentication required. Please log in.
```

Even though the user was already logged in to the system.

---

## 🔍 Root Cause

The issue was in **`src/services/chatService.js`**:

```javascript
// ❌ WRONG - Looking for wrong token key
const token = localStorage.getItem('accessToken');
```

The authentication system stores the JWT token with the key `'child_safety_token'`, not `'accessToken'`.

### Why This Happened

The chatService was trying to retrieve the access token using the wrong localStorage key. When it couldn't find the token, it threw the "Authentication required" error even though the user was authenticated.

---

## ✅ Solution

Updated **`src/services/chatService.js`** to use the correct token keys:

### Changes Made:

#### 1. Fixed Token Retrieval (Line ~41-44)

**Before:**
```javascript
const token = localStorage.getItem('accessToken');
if (!token) {
  throw new Error('Authentication required. Please log in.');
}
```

**After:**
```javascript
// Check both localStorage and sessionStorage for the token
const token = localStorage.getItem('child_safety_token') || 
              sessionStorage.getItem('child_safety_token');

if (!token) {
  throw new Error('Authentication required. Please log in.');
}
```

**Why:**
- Uses correct token key: `'child_safety_token'`
- Checks both `localStorage` and `sessionStorage` (AuthContext stores in both)
- Matches the authentication pattern used throughout the application

#### 2. Fixed BASE_URL to Use Environment Variable (Line ~9)

**Before:**
```javascript
const BASE_URL = "http://localhost:3000";
```

**After:**
```javascript
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
```

**Why:**
- Uses environment variable for API URL consistency
- Matches the pattern used in `apiClient.js`
- Includes `/api/v1` prefix required by backend

---

## 🎯 How It Works Now

### Authentication Flow:

1. **User logs in** → AuthContext stores token as `'child_safety_token'` in localStorage and sessionStorage
2. **User opens Sahayak AI page** → SahayakAI.jsx component loads
3. **User sends a message** → useChat hook calls `chatService.sendChatMessage()`
4. **chatService retrieves token** → Uses correct key `'child_safety_token'`
5. **Token found!** → Includes token in Authorization header: `Bearer {token}`
6. **Backend validates token** → JwtAuthGuard validates the token
7. **Chat works!** → AI responds to user's question

---

## 📁 Files Modified

### 1. **`src/services/chatService.js`** ✅

**Changes:**
- Line 9: Updated BASE_URL to use environment variable
- Line 41-43: Fixed token retrieval to use correct key `'child_safety_token'`
- Added fallback to check both localStorage and sessionStorage

**Complete Updated Function:**
```javascript
export async function sendChatMessage({ message, conversation = [], childId = null }) {
  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 30_000);

  try {
    // Get JWT token from localStorage (set by AuthContext after login)
    // Check both localStorage and sessionStorage for the token
    const token = localStorage.getItem('child_safety_token') || 
                  sessionStorage.getItem('child_safety_token');
    
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    const response = await fetch(`${BASE_URL}/chat`, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body:    JSON.stringify({ message, conversation, childId }),
      signal:  controller.signal,
    });

    // ... rest of the function
  }
}
```

---

## 🧪 Testing

### How to Test:

1. **Login as Parent:**
   - Go to login page
   - Login with parent credentials
   - Verify token is stored in localStorage

2. **Open Sahayak AI:**
   - Navigate to Parent → Sahayak AI
   - Page should load without errors

3. **Send a Message:**
   - Type a question: "What is my child's health status?"
   - Click Send
   - AI should respond successfully

4. **Verify Token is Being Sent:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Send a chat message
   - Click on the `/chat` request
   - Check Headers → Request Headers
   - Verify `Authorization: Bearer {long-token-string}` is present

### Expected Results:

✅ User can send messages without authentication errors  
✅ AI responds with relevant information  
✅ No "Authentication required. Please log in." errors  
✅ Chat conversation maintains context across multiple messages

---

## 🔐 Backend Configuration (No Changes Needed)

The backend is correctly configured:

**Backend: `src/chat/chat.controller.ts`**
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PARENT)
@Post()
async sendMessage(
  @CurrentUser() user: JwtPayload,
  @Body() dto: SendChatMessageDto,
): Promise<ChatReplyDto> {
  // Chat logic
}
```

- ✅ Requires JWT authentication (`JwtAuthGuard`)
- ✅ Only allows PARENT role (`@Roles(Role.PARENT)`)
- ✅ Extracts user from validated token (`@CurrentUser()`)
- ✅ Rate limited: 30 requests per hour

**This is correct and secure!**

---

## 📊 Token Storage Pattern

The application uses consistent token storage throughout:

| Storage Key | Value | Used By |
|-------------|-------|---------|
| `child_safety_token` | JWT access token | All API calls (apiClient, chatService) |
| `child_safety_refresh_token` | JWT refresh token | Token refresh flow |
| `child_safety_user` | User profile object | AuthContext state |

**Storage Locations:**
- `localStorage` - Persistent across browser sessions
- `sessionStorage` - Cleared when browser tab closes

Both are checked to ensure token is found regardless of storage preference.

---

## 🚀 Build Status

✅ **Frontend builds successfully**
```bash
npm run build
✓ built in 29.30s
```

No errors, no warnings related to this fix.

---

## 📝 Summary

### Problem:
Sahayak AI was asking for authentication even when user was logged in.

### Root Cause:
chatService was looking for token with wrong key: `'accessToken'` instead of `'child_safety_token'`

### Solution:
Updated chatService to use correct token key from localStorage/sessionStorage.

### Result:
✅ Sahayak AI now works correctly for authenticated parents  
✅ No breaking changes to other parts of the application  
✅ Follows existing authentication patterns  

---

**Status:** ✅ Fixed and Ready for Testing  
**Build Status:** ✅ Passing  
**Breaking Changes:** None
