-- Nahbei Alltagshilfe: Datenbank für Supabase (Region Frankfurt).
-- Erst einspielen, wenn die App mit echten Daten laufen soll. Bis dahin läuft die Vorschau nur im Browser.
--
-- Grundsätze:
--   * Das Büro sieht und ändert alles.
--   * Helfende sehen nur sich selbst, ihre eigenen Einsätze und von der Kundschaft nur, was sie für den Besuch brauchen
--     (Name, Anschrift, Telefon, Angehörige, Hinweise). Pflegegrad, Pflegekasse, Versichertennummer, Budget, Rechnungen
--     und die Löhne der anderen sehen sie nicht.
--   * Helfende dürfen an ihren Einsätzen nur Zeiten, Status, Tätigkeiten und Unterschrift eintragen.
--     Ist ein Einsatz unterschrieben, kann ihn nur noch das Büro ändern.
--   * Keine Diagnosen speichern. Pflegegrad und Kasse reichen für die Abrechnung.

create extension if not exists pgcrypto;

-- ===== Personen (Büro und Helfende), verknüpft mit dem Login =====
create table if not exists public.personen (
  id uuid primary key references auth.users (id) on delete cascade,
  rolle text not null check (rolle in ('buero', 'helfer')),
  name text not null check (char_length(name) between 1 and 120),
  telefon text not null default '',
  email text not null default '',
  lohn numeric(6, 2) not null default 0 check (lohn >= 0),
  minijob boolean not null default true,
  schulung date,
  erste_hilfe date,
  fuehrungszeugnis date,
  notiz text not null default '' check (char_length(notiz) <= 400),
  aktiv boolean not null default true,
  erstellt timestamptz not null default now()
);

-- Ist die angemeldete Person im Büro? (security definer, damit die Regel die Tabelle lesen darf, ohne sich selbst zu prüfen)
create or replace function public.ist_buero() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.personen where id = auth.uid() and rolle = 'buero' and aktiv);
$$;

-- ===== Firma (genau eine Zeile) =====
create table if not exists public.firma (
  id boolean primary key default true check (id),
  name text not null default '',
  zusatz text not null default '',
  inhaber text not null default '',
  anschrift text not null default '',
  telefon text not null default '',
  email text not null default '',
  ik text not null default '',
  steuernr text not null default '',
  anerkennung text not null default '',
  satz numeric(6, 2) not null default 38 check (satz >= 0),
  anfahrt numeric(6, 2) not null default 5 check (anfahrt >= 0),
  takt int not null default 15 check (takt in (5, 10, 15, 30)),
  entlastung numeric(6, 2) not null default 131,
  minijob numeric(7, 2) not null default 603,
  ust_text text not null default ''
);
insert into public.firma (id) values (true) on conflict do nothing;

-- ===== Kundschaft: Teil für den Besuch (Helfende dürfen lesen) =====
create table if not exists public.kunden (
  id uuid primary key default gen_random_uuid(),
  vorname text not null check (char_length(vorname) between 1 and 80),
  name text not null check (char_length(name) between 1 and 80),
  strasse text not null default '',
  ort text not null default '',
  telefon text not null default '',
  angehoerige text not null default '' check (char_length(angehoerige) <= 300),
  hinweise text not null default '' check (char_length(hinweise) <= 600),
  aktiv boolean not null default true,
  erstellt timestamptz not null default now()
);

-- ===== Kundschaft: Teil für die Abrechnung (nur Büro) =====
create table if not exists public.kunden_kasse (
  kunde uuid primary key references public.kunden (id) on delete cascade,
  pflegegrad int not null check (pflegegrad between 1 and 5),
  kasse text not null default '',
  versnr text not null default '' check (versnr = '' or versnr ~ '^[A-Z][0-9]{9}$'),
  abtretung date,
  guthaben numeric(8, 2) not null default 0 check (guthaben >= 0),
  stand date,                       -- Monat, auf den sich das Guthaben bezieht (1. des Monats)
  umwandlung numeric(7, 2) not null default 0 check (umwandlung >= 0),
  zuzahlung boolean not null default false
);

-- ===== Einsätze =====
create table if not exists public.einsaetze (
  id uuid primary key default gen_random_uuid(),
  kunde uuid not null references public.kunden (id) on delete restrict,
  helfer uuid references public.personen (id) on delete set null,
  datum date not null,
  von time not null,
  bis time not null check (bis > von),
  taetigkeiten text[] not null default '{}' check (taetigkeiten <@ array['haushalt', 'einkauf', 'begleitung', 'gesellschaft', 'waesche', 'garten']),
  notiz text not null default '' check (char_length(notiz) <= 400),
  status text not null default 'geplant' check (status in ('geplant', 'laeuft', 'erledigt', 'abgesagt')),
  grund text not null default '' check (char_length(grund) <= 200),
  ist_von time,
  ist_bis time,
  unterschrift_pfad text check (unterschrift_pfad is null or char_length(unterschrift_pfad) <= 60000),
  unterschrift_name text check (unterschrift_name is null or char_length(unterschrift_name) <= 80),
  unterschrift_zeit timestamptz,
  papier boolean not null default false,
  geaendert timestamptz not null default now()
);
create index if not exists einsaetze_datum on public.einsaetze (datum);
create index if not exists einsaetze_helfer on public.einsaetze (helfer, datum);
create index if not exists einsaetze_kunde on public.einsaetze (kunde, datum);

-- ===== Rechnungen (Leistungsnachweise an die Pflegekasse) =====
create table if not exists public.rechnungen (
  id uuid primary key default gen_random_uuid(),
  nr text not null unique,
  kunde uuid not null references public.kunden (id) on delete restrict,
  monat date not null,               -- 1. des Monats
  datum date not null default current_date,
  einsaetze uuid[] not null,
  summe numeric(9, 2) not null,
  kasse numeric(9, 2) not null,
  umwandlung numeric(9, 2) not null default 0,
  selbst numeric(9, 2) not null,
  unique (kunde, monat)
);

-- ===== Zugriffsregeln =====
alter table public.personen enable row level security;
alter table public.firma enable row level security;
alter table public.kunden enable row level security;
alter table public.kunden_kasse enable row level security;
alter table public.einsaetze enable row level security;
alter table public.rechnungen enable row level security;

revoke all on public.personen, public.firma, public.kunden, public.kunden_kasse, public.einsaetze, public.rechnungen from anon;
grant select, insert, update, delete on public.personen, public.firma, public.kunden, public.kunden_kasse, public.einsaetze, public.rechnungen to authenticated;

-- Personen: jede Person sieht sich selbst, das Büro alle. Nur das Büro legt an und ändert.
drop policy if exists personen_lesen on public.personen;
create policy personen_lesen on public.personen for select to authenticated using (id = auth.uid() or public.ist_buero());
drop policy if exists personen_buero on public.personen;
create policy personen_buero on public.personen for all to authenticated using (public.ist_buero()) with check (public.ist_buero());

-- Firma: alle Angemeldeten lesen (Name im Kopf), nur das Büro ändert.
drop policy if exists firma_lesen on public.firma;
create policy firma_lesen on public.firma for select to authenticated using (true);
drop policy if exists firma_buero on public.firma;
create policy firma_buero on public.firma for update to authenticated using (public.ist_buero()) with check (public.ist_buero());

-- Kundschaft (Besuchsteil): Helfende nur, wenn sie in den letzten 30 Tagen oder künftig dort eingeplant sind.
drop policy if exists kunden_lesen on public.kunden;
create policy kunden_lesen on public.kunden for select to authenticated using (
  public.ist_buero() or exists (select 1 from public.einsaetze e where e.kunde = kunden.id and e.helfer = auth.uid() and e.datum >= current_date - 30));
drop policy if exists kunden_buero on public.kunden;
create policy kunden_buero on public.kunden for all to authenticated using (public.ist_buero()) with check (public.ist_buero());

-- Kassendaten und Rechnungen: nur Büro.
drop policy if exists kasse_buero on public.kunden_kasse;
create policy kasse_buero on public.kunden_kasse for all to authenticated using (public.ist_buero()) with check (public.ist_buero());
drop policy if exists rechnungen_buero on public.rechnungen;
create policy rechnungen_buero on public.rechnungen for all to authenticated using (public.ist_buero()) with check (public.ist_buero());

-- Einsätze: Büro alles; Helfende lesen und ändern nur ihre eigenen.
drop policy if exists einsaetze_buero on public.einsaetze;
create policy einsaetze_buero on public.einsaetze for all to authenticated using (public.ist_buero()) with check (public.ist_buero());
drop policy if exists einsaetze_helfer_lesen on public.einsaetze;
create policy einsaetze_helfer_lesen on public.einsaetze for select to authenticated using (helfer = auth.uid());
drop policy if exists einsaetze_helfer_aendern on public.einsaetze;
create policy einsaetze_helfer_aendern on public.einsaetze for update to authenticated using (helfer = auth.uid()) with check (helfer = auth.uid());

-- Was Helfende an einem Einsatz ändern dürfen (Regeln greifen auch, wenn jemand die App umgeht)
create or replace function public.einsatz_pruefen() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.geaendert := now();
  if public.ist_buero() then return new; end if;
  if old.unterschrift_pfad is not null or old.papier then
    raise exception 'Dieser Einsatz ist unterschrieben. Änderungen nur über das Büro.';
  end if;
  if new.kunde is distinct from old.kunde or new.helfer is distinct from old.helfer or new.datum is distinct from old.datum
     or new.von is distinct from old.von or new.bis is distinct from old.bis or new.notiz is distinct from old.notiz
     or new.papier is distinct from old.papier then
    raise exception 'Termin, Kundschaft und Notiz ändert nur das Büro.';
  end if;
  if new.status = 'geplant' and old.status <> 'geplant' then
    raise exception 'Ein begonnener Einsatz kann nicht zurück auf geplant.';
  end if;
  if new.unterschrift_pfad is not null and (new.status <> 'erledigt' or new.ist_von is null or new.ist_bis is null) then
    raise exception 'Unterschrift erst, wenn Beginn und Ende eingetragen sind.';
  end if;
  if new.unterschrift_pfad is not null then new.unterschrift_zeit := now(); end if;
  return new;
end $$;
drop trigger if exists einsatz_pruefen on public.einsaetze;
create trigger einsatz_pruefen before update on public.einsaetze for each row execute function public.einsatz_pruefen();
