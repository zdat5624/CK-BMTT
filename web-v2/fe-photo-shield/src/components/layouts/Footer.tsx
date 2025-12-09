export default function Footer() {
    return (
        <footer className="
      w-full 
      border-t border-gray-200/60 
      bg-gray-50/70 backdrop-blur-xl
    ">
            <div className="container mx-auto px-6 py-6 text-center text-gray-600">
                © {new Date().getFullYear()} Photo Shield — Chia sẻ hình ảnh của bạn.
            </div>
        </footer>
    );
}
