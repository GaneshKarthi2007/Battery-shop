import { CircleLoader } from "./CircleLoader";

export interface BatteryLoaderProps {
    text?: string;
}

export function BatteryLoader({ text = "Loading System..." }: BatteryLoaderProps) {
    return <CircleLoader size="fullscreen" text={text} />;
}
