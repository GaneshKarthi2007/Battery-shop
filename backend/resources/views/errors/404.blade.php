<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Not Found</title>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Lucide icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        /* Entry animations */
        @keyframes fadeUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes batteryDrain {
            0% { height: 90%; background-color: #22c55e; }
            40% { height: 50%; background-color: #eab308; }
            80% { height: 15%; background-color: #ef4444; }
            100% { height: 0%; background-color: #ef4444; }
        }
        @keyframes popIn {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0); }
            30% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            60% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }

        .animate-fade-up { animation: fadeUp 0.5s ease-out forwards; opacity: 0; }
        .animate-fade-down { animation: fadeDown 0.5s ease-out forwards; opacity: 0; }
        .animate-drain { animation: batteryDrain 4s ease-in-out forwards; }
        .animate-pop { animation: popIn 0.6s ease-out forwards; opacity: 0; animation-delay: 3.5s; }
        
        .delay-500 { animation-delay: 0.5s; }
        .delay-600 { animation-delay: 0.6s; }
        .delay-700 { animation-delay: 0.7s; }
        .delay-800 { animation-delay: 0.8s; }
    </style>
</head>
<body class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center antialiased">
    <div class="relative mb-12 w-32 h-48 flex items-center justify-center">
        <!-- Animated Battery Outline -->
        <div class="absolute inset-0 border-[10px] border-gray-300 rounded-[2rem] flex flex-col justify-end overflow-hidden pb-2 px-2 bg-white shadow-sm animate-fade-down">
            <!-- Draining Charge -->
            <div class="w-full rounded-xl origin-bottom animate-drain h-[90%] bg-[#22c55e]"></div>
            
            <!-- Spark / Warning Icon -->
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500 animate-pop">
                <i data-lucide="zap-off" class="w-12 h-12"></i>
            </div>
        </div>
        <!-- Battery Top Terminal -->
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-4 bg-gray-300 rounded-t-md"></div>
    </div>

    <h1 class="text-6xl md:text-8xl font-black text-gray-900 mb-4 tracking-tight animate-fade-up delay-500">404</h1>
    <h2 class="text-2xl md:text-3xl font-bold text-gray-700 mb-6 animate-fade-up delay-600">Out of Juice!</h2>
    <p class="text-gray-500 max-w-md mx-auto mb-10 font-medium text-lg animate-fade-up delay-700">
        The page you're looking for seems to have completely run out of charge. It might have been moved or doesn't exist.
    </p>

    <div class="animate-fade-up delay-800">
        <button onclick="window.location.href = 'http://localhost:5173'" class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 font-bold text-lg cursor-pointer mx-auto">
            <i data-lucide="home" class="w-5 h-5"></i>
            Return to Dashboard
        </button>
    </div>

    <script>
      lucide.createIcons();
    </script>
</body>
</html>
