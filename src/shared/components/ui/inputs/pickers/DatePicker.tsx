'use client';

import { Button } from '@/shared/components/ui/buttons/Button';
import { IconButton } from '@/shared/components/ui/buttons/IconButton';
import { Icon } from '@/shared/components/ui/data-display/Icon';
import { TextField } from '@/shared/components/ui/inputs/TextField';
import { Dialog } from '@/shared/components/ui/surfaces/Dialog';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';

interface DatePickerProps {
  label?: string;
  value?: Date | null;
  onChange?: (date: Date) => void;
}

export const DatePicker = ({ label = 'Select date', value, onChange }: DatePickerProps) => {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(value ? dayjs(value) : null);
  const [viewDate, setViewDate] = useState<Dayjs>(dayjs());
  const [view, setView] = useState<'calendar' | 'year'>('calendar');
  const yearRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    if (value) {
      const d = dayjs(value);
      setSelectedDate(d);
      setViewDate(d);
    }
  }, [value]);

  // Scroll to selected year when year view opens
  useEffect(() => {
    if (open && view === 'year') {
      const yearElement = yearRefs.current[viewDate.year()];
      yearElement?.scrollIntoView({ block: 'center' });
    }
  }, [open, view, viewDate]);

  const handleOpen = () => {
    setOpen(true);
    setView('calendar'); // Reset to calendar view on open
  };
  const handleClose = () => setOpen(false);

  const handleDateSelect = (day: number) => {
    const newDate = viewDate.date(day);
    setSelectedDate(newDate);
  };

  const handleYearSelect = (year: number) => {
    setViewDate(viewDate.year(year));
    setView('calendar');
  };

  const handleOk = () => {
    if (selectedDate && onChange) {
      onChange(selectedDate.toDate());
    }
    handleClose();
  };

  const handlePrevMonth = () => setViewDate(viewDate.subtract(1, 'month'));
  const handleNextMonth = () => setViewDate(viewDate.add(1, 'month'));

  // Calendar Logic
  const daysInMonth = viewDate.daysInMonth();
  const startDay = viewDate.startOf('month').day(); // 0 (Sun) to 6 (Sat)
  const days = [];

  // Empty slots for start of month
  for (let i = 0; i < startDay; i++) {
    days.push(<div key={`empty-${i}`} className="calendar-day outside-month" />);
  }

  // Days
  for (let d = 1; d <= daysInMonth; d++) {
    const currentDate = viewDate.date(d);
    const isSelected = selectedDate?.isSame(currentDate, 'day');
    const isToday = dayjs().isSame(currentDate, 'day');

    days.push(
      <div
        key={`day-${d}`}
        className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday && !isSelected ? 'today' : ''}`}
        onClick={() => handleDateSelect(d)}
      >
        {d}
      </div>,
    );
  }

  // Years Logic
  const years = [];
  const currentYear = dayjs().year();
  for (let y = currentYear - 100; y <= currentYear + 100; y++) {
    years.push(y);
  }

  return (
    <>
      <div onClick={handleOpen}>
        <TextField
          label={label}
          value={selectedDate ? selectedDate.format('MM/DD/YYYY') : ''}
          readOnly
          style={{ cursor: 'pointer', pointerEvents: 'none' }} // Hack to make parent click work reliably
        >
          <IconButton
            slot="trailing-icon"
            onClick={(e) => {
              e.stopPropagation();
              handleOpen();
            }}
          >
            <Icon>calendar_today</Icon>
          </IconButton>
        </TextField>
      </div>

      <Dialog open={open} onClose={handleClose} className="picker-dialog">
        <div slot="content" style={{ padding: 0 }}>
          <div className="picker-header">
            <div className="picker-header-label">Select date</div>
            <div className="picker-header-display">
              {selectedDate ? selectedDate.format('ddd, MMM D') : 'Select date'}
            </div>
          </div>

          <div className="picker-body">
            {view === 'calendar' ? (
              <>
                <div className="calendar-navigation">
                  <span
                    className="calendar-month-year"
                    onClick={() => setView('year')}
                    style={{ cursor: 'pointer' }}
                  >
                    {viewDate.format('MMMM YYYY')}{' '}
                    <Icon style={{ fontSize: '16px' }}>arrow_drop_down</Icon>
                  </span>
                  <div style={{ display: 'flex' }}>
                    <IconButton variant="standard" onClick={handlePrevMonth}>
                      <Icon>chevron_left</Icon>
                    </IconButton>
                    <IconButton variant="standard" onClick={handleNextMonth}>
                      <Icon>chevron_right</Icon>
                    </IconButton>
                  </div>
                </div>

                <div className="calendar-weekdays">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <div key={index} className="calendar-weekday">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="calendar-days">{days}</div>
              </>
            ) : (
              <div className="year-selector">
                {years.map((year) => (
                  <div
                    key={year}
                    id={`year-${year}`}
                    ref={(element) => {
                      yearRefs.current[year] = element;
                    }}
                    className={`year-option ${year === viewDate.year() ? 'selected' : ''}`}
                    onClick={() => handleYearSelect(year)}
                  >
                    {year}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div
          slot="actions"
          style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '8px' }}
        >
          <Button variant="text" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="text" onClick={handleOk}>
            OK
          </Button>
        </div>
      </Dialog>
    </>
  );
};
