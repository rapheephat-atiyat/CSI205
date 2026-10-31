interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  highlight?: boolean;
}

export default function StatCard({ title, value, subtitle, highlight }: StatCardProps) {
  return (
    <div className={`p-5 rounded-2xl border transition shadow-sm ${
      highlight 
        ? 'bg-red-500 text-white border-red-500' 
        : 'bg-white text-gray-800 border-gray-100'
    }`}>
      <p className={`text-xs font-medium mb-2 ${highlight ? 'text-red-100' : 'text-gray-400'}`}>
        {title}
      </p>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && (
        <p className={`text-xs mt-1 ${highlight ? 'text-red-200' : 'text-gray-400'}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}