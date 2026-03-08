'use client';

import { Button } from '@/shared/components/ui/buttons/Button';
import { IconButton } from '@/shared/components/ui/buttons/IconButton';
import { Icon } from '@/shared/components/ui/data-display/Icon';
import { TextField } from '@/shared/components/ui/inputs/TextField';
import { Dialog } from '@/shared/components/ui/surfaces/Dialog';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

interface TimePickerProps {
  label?: string;
  value?: Date | null;
  onChange?: (date: Date) => void;
}

export const TimePicker = ({ label = 'Select time', value, onChange }: TimePickerProps) => {
  const [open, setOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Dayjs>(value ? dayjs(value) : dayjs());
  const [mode, setMode] = useState<'hour' | 'minute'>('hour'); // 'hour' or 'minute'

  useEffect(() => {
    if (value) {
      setSelectedTime(dayjs(value));
    }
  }, [value]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Sync open state with Dialog close event (handled by Dialog component internally, but we need to ensure state sync if closed via other means like ESC)
  // Since our custom Dialog component wrapper passes props, we should ensure the wrapper handles onClose prop correctly.
  // The user reported intermittent issues, which often means the web component 'open' state is out of sync with React 'open' state.
  // We'll add an explicit effect to sync if needed, but primarily rely on the onClose callback being called.

  const handleOk = () => {
    if (onChange) {
      onChange(selectedTime.toDate());
    }
    handleClose();
  };

  const handleHourSelect = (hour: number) => {
    // Keep minute, update hour
    // Handle 12h format logic if needed, but here let's assume 24h internal, 12h display
    // For simplicity in this demo, let's map visual 1-12 to actual hours based on AM/PM
    let newHour = hour;
    if (selectedTime.format('A') === 'PM' && hour !== 12) {
      newHour += 12;
    }
    if (selectedTime.format('A') === 'AM' && hour === 12) {
      newHour = 0;
    }

    setSelectedTime(selectedTime.hour(newHour));
    setMode('minute'); // Auto switch to minute
  };

  const handleMinuteSelect = (minute: number) => {
    setSelectedTime(selectedTime.minute(minute));
  };

  const toggleAmPm = (ampm: 'AM' | 'PM') => {
    const currentHour = selectedTime.hour();
    if (ampm === 'AM' && currentHour >= 12) {
      setSelectedTime(selectedTime.subtract(12, 'hour'));
    }
    if (ampm === 'PM' && currentHour < 12) {
      setSelectedTime(selectedTime.add(12, 'hour'));
    }
  };

  // Clock Face Rendering
  const renderClockNumbers = () => {
    const numbers = [];
    const isHour = mode === 'hour';
    const count = isHour ? 12 : 12; // Minutes show 00, 05, 10... (mapped to 1-12 positions)
    const radius = 100; // px

    for (let i = 1; i <= count; i++) {
      // 360 / 12 = 30
      // Position from center (128, 128)
      // We use CSS transform for rotation

      // Let's use CSS transform approach in styles, but here we need inline styles for rotation
      const rotation = i * 30;

      const displayValue = isHour ? i : i === 12 ? '00' : i * 5;

      // Check if active
      let isActive = false;
      if (isHour) {
        const h12 = selectedTime.hour() % 12 || 12;
        isActive = h12 === i;
      } else {
        const m = selectedTime.minute();
        // Check if minute matches the 5-minute marker (approx)
        isActive = Math.round(m / 5) === (i === 12 ? 0 : i) || (i === 12 && m === 0);
      }

      const handleClick = () => {
        if (isHour) {
          handleHourSelect(i);
        } else {
          handleMinuteSelect(i === 12 ? 0 : i * 5);
        }
      };

      numbers.push(
        <div
          key={i}
          className={`clock-number ${isActive ? 'active' : ''}`}
          style={{
            transform: `rotate(${rotation}deg) translateY(-${radius}px) rotate(-${rotation}deg)`,
          }}
          onClick={handleClick}
        >
          {displayValue}
        </div>,
      );
    }
    return numbers;
  };

  // Clock Hand Rotation
  const getHandRotation = () => {
    if (mode === 'hour') {
      const h = selectedTime.hour() % 12;
      // In a picker, we usually want the hand to point exactly to the selected hour number
      // rather than interpolating based on minutes (which is confusing for selection).
      // So we remove the "+ m * 0.5" part.
      return h * 30;
    } else {
      return selectedTime.minute() * 6; // 6 deg per minute
    }
  };

  return (
    <>
      <div onClick={handleOpen}>
        <TextField
          label={label}
          value={selectedTime.format('hh:mm A')}
          readOnly
          style={{ cursor: 'pointer', pointerEvents: 'none' }}
        >
          <IconButton
            slot="trailing-icon"
            onClick={(e) => {
              e.stopPropagation();
              handleOpen();
            }}
          >
            <Icon>schedule</Icon>
          </IconButton>
        </TextField>
      </div>

      <Dialog open={open} onClose={handleClose} className="picker-dialog">
        <div slot="content" style={{ padding: 0 }}>
          <div className="picker-header" style={{ alignItems: 'center', paddingBottom: '24px' }}>
            <div className="picker-header-label" style={{ alignSelf: 'flex-start' }}>
              Select time
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div className="picker-header-display-large">
                <div
                  className={`time-display-unit ${mode === 'hour' ? 'active' : ''}`}
                  onClick={() => setMode('hour')}
                >
                  {selectedTime.format('hh')}
                </div>
                <span className="time-display-separator">:</span>
                <div
                  className={`time-display-unit ${mode === 'minute' ? 'active' : ''}`}
                  onClick={() => setMode('minute')}
                >
                  {selectedTime.format('mm')}
                </div>
              </div>

              <div className="am-pm-selector">
                <button
                  className={`am-pm-option ${selectedTime.format('A') === 'AM' ? 'active' : ''}`}
                  onClick={() => toggleAmPm('AM')}
                >
                  AM
                </button>
                <button
                  className={`am-pm-option ${selectedTime.format('A') === 'PM' ? 'active' : ''}`}
                  onClick={() => toggleAmPm('PM')}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          <div className="picker-body">
            <div className="clock-face-container">
              <div className="clock-center-dot" />
              <div
                className="clock-hand"
                style={{
                  height: '100px',
                  transform: `rotate(${getHandRotation()}deg)`,
                }}
              />
              {renderClockNumbers()}
            </div>
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
