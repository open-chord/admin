import { ArrowUp } from "lucide-react";
import type { DragEvent, ReactNode } from "react";

export function DropField({
  icon,
  title,
  hint,
  onClick,
  onDrop,
}: {
  icon: ReactNode;
  title: string;
  hint: string;
  onClick: () => void;
  onDrop: (file?: File) => void;
}) {
  const drop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    onDrop(event.dataTransfer.files[0]);
  };

  return (
    <button className="drop-field" type="button" onClick={onClick} onDragOver={(event) => event.preventDefault()} onDrop={drop}>
      <span>{icon}</span><strong>{title}</strong><small>{hint}</small><i>Выбрать файл <ArrowUp /></i>
    </button>
  );
}
