# Emergency Contacts Error Fix

## The Error
"Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

## Root Cause
This error occurs when the API returns an HTML error page instead of JSON. This happens because:

1. **Server wasn't restarted** after adding the new emergency contacts endpoints
2. The backend routes weren't loaded with the new code

## Solution

### Step 1: Restart the Backend Server
The backend server (running on port 3001) needs to be restarted to load the new emergency contacts API endpoints.

```bash
# Kill the existing server process
taskkill /F /PID <process_id>

# Start the server again
cd server
npm start
```

### Step 2: Verify the Server is Running
Check that the server started successfully and MongoDB connected:
- Look for "✅ Aidspeak proxy listening on http://localhost:3001"
- Look for "✅ MongoDB Connected Successfully"

### Step 3: Test the API Endpoint
Try accessing the endpoint directly:
```bash
curl http://localhost:3001/api/profiles/test@example.com/emergency-contacts
```

Should return:
```json
{"emergencyContacts":[]}
```

### Step 4: Clear Browser Cache (Optional)
If the issue persists:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Check "Disable cache"
4. Refresh the page

## How to Verify It's Fixed

1. Open the EmergencyPage
2. Click "Add Contact"
3. Fill in the form
4. Click "Save Contact"
5. Check browser console for logs:
   - "Adding contact: {name, email, relation}"
   - "User email: ..."
   - "Response status: 200"
   - "Response data: {emergencyContacts: [...]}"

## If Still Not Working

Check the browser console for the actual error and the Network tab to see:
- What URL is being called
- What status code is returned
- What the actual response body is
