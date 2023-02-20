import React from "react";

interface StatisticProps {
    title: string
    value: React.ReactNode
    label?: string
}

export function Statistic({title, value, label}: StatisticProps) {
    return(
        <div className="py-6 px-8 bg-gray-800 rounded-lg flex flex-col justify-between items-center">
            <p>{title}</p>
            <div className="mt-9">{value}</div>
            {Boolean(label) && <p className=""></p>}
        </div>
    )
}
