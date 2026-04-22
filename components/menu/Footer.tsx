import { MapPin, Clock, Bike, Instagram } from "lucide-react";

type Props = {
  horario: string;
  direccion: string;
  ciudad: string;
  nombre: string;
};

export function Footer({ horario, direccion, ciudad, nombre }: Props) {
  return (
    <footer className="mt-10 bg-mana-black text-white/80">
      <div className="container py-10 grid gap-6 sm:grid-cols-3">
        <div>
          <h3 className="font-display text-xl font-black">
            <span className="text-mana-red">MANÁ</span>{" "}
            <span className="text-mana-yellow">Fast Food</span>
          </h3>
          <p className="mt-2 text-sm text-white/60">
            {nombre} · Fast food con el sabor del Orinoco.
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <p className="flex items-start gap-2">
            <Clock className="h-4 w-4 mt-0.5 text-mana-yellow shrink-0" />
            <span>{horario}</span>
          </p>
          <p className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 text-mana-yellow shrink-0" />
            <span>
              {direccion}
              <br />
              {ciudad}
            </span>
          </p>
          <p className="flex items-start gap-2">
            <Bike className="h-4 w-4 mt-0.5 text-mana-yellow shrink-0" />
            <span>Delivery y Pickup</span>
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <a
            href="https://www.instagram.com/manafood"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-white/5 hover:bg-white/10 px-4 py-2 ring-1 ring-white/10 transition"
          >
            <Instagram className="h-4 w-4 text-mana-yellow" />
            @manafood
          </a>
          <p className="text-xs text-white/40 pt-2">
            © {new Date().getFullYear()} {nombre}. Todos los derechos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
