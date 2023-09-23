const Footer = () => (
  <footer>
    <div className="custom-screen pt-16">
      <div className="mt-10 py-10 border-t items-center justify-between flex">
        <p className="text-gray-600">
          Created by{' '}
          <a
            href="https://twitter.com/terraciano_"
            className="hover:underline transition"
          >
            Juan Terraciano
          </a>{' '}
          - Based on{' '}
          <a
            href="https://twitter.com/nutlope"
            className="hover:underline transition"
          >
            Hassan
          </a>{' '}
          and{' '}
          <a
            href="https://twitter.com/kevinhou22"
            className="hover:underline transition"
          >
            {/* eslint-disable-next-line react/no-unescaped-entities */}
            Kevin's
          </a>{' '}
          <a href="https://qrgpt.io" className="hover:underline transition">
            qrGPT
          </a>
          .
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
