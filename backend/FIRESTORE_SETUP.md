# Firestore Setup Guide

## Required Firestore Indexes

The camping scraper application requires composite indexes in Firestore for efficient querying. You need to create these indexes in the Firebase Console.

### Method 1: Automatic Index Creation (Recommended)

When you run the application, Firestore will automatically detect required indexes and provide direct links to create them. Simply:

1. Run the scraper or integration test
2. Watch for error messages containing Firebase Console URLs
3. Click the provided URL to automatically create the required index
4. Wait 2-5 minutes for index to build

### Method 2: Manual Index Creation

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: `camping-scraper-prod`
3. Navigate to: **Firestore Database** → **Indexes** tab
4. Click **Create Index**

Create the following composite indexes:

#### Index 1: availability (campingName + date)
- **Collection ID**: `availability`
- **Fields**:
  - `campingName` - Ascending
  - `date` - Descending
- **Query scope**: Collection

#### Index 2: availability (region + date)
- **Collection ID**: `availability`
- **Fields**:
  - `region` - Ascending
  - `date` - Descending
- **Query scope**: Collection

### Index Build Time

- Composite indexes typically take 2-5 minutes to build
- Empty collections build instantly
- Check index status in Firebase Console → Firestore Database → Indexes

### Deployment with firestore.indexes.json

For automated deployment, you can use the provided `firestore.indexes.json` file:

```bash
firebase deploy --only firestore:indexes
```

This requires Firebase CLI to be installed and configured:

```bash
npm install -g firebase-tools
firebase login
firebase init firestore
firebase deploy --only firestore:indexes
```

## Troubleshooting

### "The query requires an index" Error

**Problem**: You see an error like:
```
Error: 9 FAILED_PRECONDITION: The query requires an index...
```

**Solution**:
1. Copy the URL from the error message
2. Open it in your browser
3. Click "Create Index"
4. Wait for index to finish building (usually 2-5 minutes)
5. Re-run your query

### Index Taking Too Long

If an index is taking more than 10 minutes:
- Check Firebase Console for index status
- Ensure you're on a Firebase plan that supports indexes
- Try deleting and recreating the index

### Query Still Failing After Index Created

- Verify index status is "Enabled" (not "Building")
- Check that field names match exactly (case-sensitive)
- Ensure you're querying the correct collection
- Clear your application's cache and restart
