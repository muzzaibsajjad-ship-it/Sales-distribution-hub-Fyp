import { motion } from "framer-motion";

const PageLoader = ({ message = "Loading..." }) => {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center text-[#4b2e2e]">
      <div className="mb-3 flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-3 w-3 rounded-full bg-[#7f2c2c]"
            animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.75, repeat: Infinity, delay: i * 0.12 }}
          />
        ))}
      </div>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
};

export default PageLoader;

