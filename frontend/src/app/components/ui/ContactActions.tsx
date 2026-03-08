import { Phone, MessageCircle } from "lucide-react";

interface ContactActionsProps {
    phoneNumber: string;
    className?: string;
    iconSize?: number;
}

export function ContactActions({ phoneNumber, className = "", iconSize = 16 }: ContactActionsProps) {
    if (!phoneNumber) return null;

    // Remove any non-digit character first
    let parsedNumber = phoneNumber.replace(/\D/g, "");

    // If the number is exactly 10 digits, it's likely an Indian number missing the country code. 
    // Automatically prepend '91'. E.g. "9876543210" -> "919876543210"
    if (parsedNumber.length === 10) {
        parsedNumber = "91" + parsedNumber;
    }

    // If there's an issue parsing or the number is effectively empty after strip, don't show the buttons
    if (!parsedNumber) return null;

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <a
                href={`tel:+${parsedNumber}`}
                onClick={(e) => e.stopPropagation()} // Prevent triggering parent clicks (like opening a row)
                className="p-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-colors shadow-sm ring-1 ring-blue-500/10"
                title="Call Customer"
            >
                <Phone size={iconSize} />
            </a>
            <a
                href={`https://wa.me/${parsedNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-full bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 transition-colors shadow-sm ring-1 ring-green-500/10"
                title="Message on WhatsApp"
            >
                <MessageCircle size={iconSize} />
            </a>
        </div>
    );
}
