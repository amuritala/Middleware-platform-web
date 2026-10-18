interface ParticipantCardProps {
  title: string;
  description: string;
  memberCount: number;
}

export default function ParticipantCard({ title, description, memberCount }: ParticipantCardProps) {
  const avatarColors = ["bg-orange-400", "bg-purple-500", "bg-blue-500", "bg-pink-500"];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-2 leading-relaxed">{description}</p>

      <div className="flex items-center mt-4">
        <div className="flex -space-x-3">
          {avatarColors.map((color, i) => (
            <div
              key={i}
              className={`w-10 h-10 rounded-full ${color} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}
            >
              {String.fromCharCode(65 + i)}
            </div>
          ))}
        </div>
        <span className="ml-3 text-sm text-gray-500 font-medium">+{memberCount}</span>
      </div>
    </div>
  );
}
