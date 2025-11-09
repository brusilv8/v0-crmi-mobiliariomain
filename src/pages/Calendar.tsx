import { useState } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useVisitas } from '@/hooks/useVisitas';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { VisitFormModal } from '@/components/calendar/VisitFormModal';
import { VisitDetailModal } from '@/components/calendar/VisitDetailModal';
import type { Visita } from '@/types/database.types';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const messages = {
  allDay: 'Dia inteiro',
  previous: 'Anterior',
  next: 'Próximo',
  today: 'Hoje',
  month: 'Mês',
  week: 'Semana',
  day: 'Dia',
  agenda: 'Agenda',
  date: 'Data',
  time: 'Hora',
  event: 'Visita',
  noEventsInRange: 'Nenhuma visita neste período',
  showMore: (total: number) => `+ Ver mais (${total})`,
};

export default function Calendar() {
  const { data: visitas, isLoading } = useVisitas();
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visita | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);

  const events = (visitas || []).map((visita) => ({
    id: visita.id,
    title: `${visita.lead?.nome || 'Lead'} - ${visita.imovel?.endereco || 'Imóvel'}`,
    start: new Date(visita.data_hora),
    end: new Date(new Date(visita.data_hora).getTime() + (visita.duracao || 60) * 60000),
    resource: visita,
  }));

  const eventStyleGetter = (event: any) => {
    const visita = event.resource as Visita;
    let backgroundColor = '#2563EB';
    
    if (visita.status === 'realizada') backgroundColor = '#10B981';
    if (visita.status === 'cancelada') backgroundColor = '#EF4444';
    
    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  const handleSelectSlot = (slotInfo: any) => {
    setSelectedSlot(slotInfo.start);
    setIsFormOpen(true);
  };

  const handleSelectEvent = (event: any) => {
    setSelectedVisit(event.resource);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedSlot(null);
  };

  const handleCloseDetail = () => {
    setSelectedVisit(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agenda de Visitas</h1>
          <p className="text-muted-foreground">Gerencie seus agendamentos</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Agendar Visita
        </Button>
      </div>

      <div className="bg-card rounded-lg border p-6" style={{ height: 'calc(100vh - 250px)' }}>
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          messages={messages}
          culture="pt-BR"
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
        />
      </div>

      <VisitFormModal
        open={isFormOpen}
        onOpenChange={handleCloseForm}
        initialDate={selectedSlot || undefined}
      />

      {selectedVisit && (
        <VisitDetailModal
          visit={selectedVisit}
          open={!!selectedVisit}
          onOpenChange={handleCloseDetail}
        />
      )}
    </div>
  );
}
