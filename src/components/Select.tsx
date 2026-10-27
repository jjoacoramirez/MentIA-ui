import React, { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

/** The menu is rendered by MentIA so its open state also follows the theme. */
export function Select({ value, onChange, children }: {
  value: string | number;
  onChange: (event: { target: { value: string } }) => void;
  children: React.ReactNode;
}) {
  const options = React.Children.toArray(children).filter(React.isValidElement).map(child => {
    const props = (child as React.ReactElement<{value?: string | number; children: React.ReactNode}>).props;
    return { value: String(props.value ?? props.children), label: props.children };
  });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [above, setAbove] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();
  const selected = Math.max(0, options.findIndex(o => o.value === String(value)));
  function show() {
    setActive(selected);
    const rect = ref.current?.getBoundingClientRect();
    const frame = ref.current?.closest("main")?.getBoundingClientRect();
    setAbove(!!rect && (frame?.bottom ?? window.innerHeight) - rect.bottom < 230 && rect.top - (frame?.top ?? 0) > 230);
    setOpen(true);
  }
  function choose(index: number) {
    onChange({ target: { value: options[index].value } });
    setOpen(false);
    button.current?.focus();
  }
  useEffect(() => {
    function outside(e: PointerEvent) { if (!ref.current?.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  useEffect(() => {
    if (open) document.getElementById(`${id}-${active}`)?.scrollIntoView?.({ block: "nearest" });
  }, [open, active, id]);
  return <div className="mentia-select" ref={ref} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
    <button id={`${id}-trigger`} ref={button} type="button" role="combobox" aria-haspopup="listbox" aria-expanded={open}
      aria-controls={`${id}-list`} aria-activedescendant={open ? `${id}-${active}` : undefined}
      onClick={() => open ? setOpen(false) : show()}
      onKeyDown={e => {
        if (["ArrowDown", "ArrowUp", "Home", "End", "Escape", "Enter", " "].includes(e.key)) e.preventDefault();
        if (e.key === "Escape") setOpen(false);
        else if (e.key === "Enter" || e.key === " ") open ? choose(active) : show();
        else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
          if (!open) show();
          else setActive(i => e.key === "Home" ? 0 : e.key === "End" ? options.length - 1 : (i + (e.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
        }
      }} className="select-trigger">
      <span>{options[selected]?.label}</span><ChevronDown size={18} aria-hidden="true" />
    </button>
    {open && <div id={`${id}-list`} role="listbox" aria-labelledby={`${id}-trigger`} className={`select-menu ${above ? "above" : ""}`}>
      {options.map((option, i) => <div key={option.value} id={`${id}-${i}`} role="option" aria-selected={i === selected}
        className={`select-option ${i === active ? "focused" : ""}`} onPointerMove={() => setActive(i)}
        onPointerDown={e => e.preventDefault()} onClick={e => { e.preventDefault(); choose(i); }}>
        {option.label}{i === selected && <Check size={16} aria-hidden="true" />}
      </div>)}
    </div>}
  </div>;
}
