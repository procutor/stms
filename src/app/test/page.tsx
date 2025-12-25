export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-green-600 mb-4">
            ✅ Vercel Deployment Test
          </h1>
          <p className="text-lg text-gray-700 mb-6">
            If you can see this page, your Vercel deployment is working correctly!
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Next.js App Router working</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Static page rendering correctly</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Vercel deployment successful</span>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h2 className="font-semibold text-blue-800 mb-2">Next Steps:</h2>
            <ul className="text-blue-700 space-y-1">
              <li>• If you see this, your main page 404 is likely a database or environment variable issue</li>
              <li>• Check your Vercel dashboard for build logs</li>
              <li>• Verify all environment variables are set</li>
              <li>• Ensure your database is accessible from Vercel</li>
            </ul>
          </div>
          
          <div className="mt-6">
            <a 
              href="/" 
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}