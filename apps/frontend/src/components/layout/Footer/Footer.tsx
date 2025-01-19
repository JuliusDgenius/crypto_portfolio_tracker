export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            © {new Date().getFullYear()} Crypto Portfolio. All rights reserved.
          </div>
          <div className="flex space-x-6">
            <a href="/privacy" className="text-sm text-gray-500 hover:text-gray-700">
              Privacy Policy
            </a>
            <a href="/terms" className="text-sm text-gray-500 hover:text-gray-700">
              Terms of Service
            </a>
            <a href="/contact" className="text-sm text-gray-500 hover:text-gray-700">
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
