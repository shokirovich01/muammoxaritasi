"use client";
import dynamic from "next/dynamic";
const Loading = () => <div className="flex h-80 w-full items-center justify-center rounded-2xl bg-gray-100 text-gray-500">Xarita yuklanmoqda…</div>;
export const ReportsMapDynamic = dynamic(() => import("./ReportsMap"), { ssr: false, loading: Loading });
export const LocationPickerDynamic = dynamic(() => import("./LocationPicker"), { ssr: false, loading: Loading });
