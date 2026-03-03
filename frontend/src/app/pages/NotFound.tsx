import { motion } from "framer-motion";
import { Link } from "react-router";
import { Home, ZapOff } from "lucide-react";
import { Button } from "../components/Button";

export function NotFound() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="relative mb-12 w-32 h-48 flex items-center justify-center">
                {/* Animated Battery Outline */}
                <motion.div
                    className="absolute inset-0 border-[10px] border-gray-300 rounded-[2rem] flex flex-col justify-end overflow-hidden pb-2 px-2 bg-white shadow-sm"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Draining Charge */}
                    <motion.div
                        className="w-full rounded-xl origin-bottom"
                        initial={{ height: "90%", backgroundColor: "#22c55e" }} // Green
                        animate={{
                            height: ["90%", "50%", "15%", "0%"],
                            backgroundColor: ["#22c55e", "#eab308", "#ef4444", "#ef4444"]
                        }}
                        transition={{ duration: 4, ease: "easeInOut", times: [0, 0.4, 0.8, 1] }}
                    />

                    {/* Spark / Warning Icon that appears when empty */}
                    <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: [0, 1, 0, 1], scale: 1 }}
                        transition={{ delay: 3.5, duration: 0.6, times: [0, 0.3, 0.6, 1] }}
                    >
                        <ZapOff className="w-12 h-12" />
                    </motion.div>
                </motion.div>
                {/* Battery Top Terminal */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-4 bg-gray-300 rounded-t-md"></div>
            </div>

            <motion.h1
                className="text-6xl md:text-8xl font-black text-gray-900 mb-4 tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                404
            </motion.h1>
            <motion.h2
                className="text-2xl md:text-3xl font-bold text-gray-700 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                Out of Juice!
            </motion.h2>
            <motion.p
                className="text-gray-500 max-w-md mx-auto mb-10 font-medium text-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
            >
                The page you're looking for seems to have completely run out of charge. It might have been moved or doesn't exist.
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
            >
                <Link to="/">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 font-bold text-lg">
                        <Home className="w-5 h-5" />
                        Return to Dashboard
                    </Button>
                </Link>
            </motion.div>
        </div>
    );
}
