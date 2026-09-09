'use client';

import { PERU_LOCATIONS } from '@/core/logistics/peruLocations';
import type { CartItem } from '@/features/storage/context/CartContext';
import { Icon } from '@/shared/components/ui';
import { Select } from '@/shared/components/ui/inputs/Select';
import type { ShippingInfo } from './Checkout';
import styles from './Checkout.module.css';

interface SelectOption {
  value: string;
  label: string;
}

interface CheckoutShippingStepProps {
  cartItems: CartItem[];
  totalAmount: number;
  shippingInfo: ShippingInfo;
  onShippingInfoChange: (updater: (prev: ShippingInfo) => ShippingInfo) => void;
  departments: SelectOption[];
  provinces: SelectOption[];
  districts: SelectOption[];
  businessAddress?: string;
  businessCity?: string;
  onNext: () => void;
}

export function CheckoutShippingStep({
  cartItems,
  totalAmount,
  shippingInfo,
  onShippingInfoChange,
  departments,
  provinces,
  districts,
  businessAddress,
  businessCity,
  onNext,
}: CheckoutShippingStepProps) {
  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onShippingInfoChange((prev) => ({
      ...prev,
      department: e.target.value,
      province: '',
      district: '',
      ubigeo: '',
    }));
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onShippingInfoChange((prev) => ({
      ...prev,
      province: e.target.value,
      district: '',
      ubigeo: '',
    }));
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const districtName = e.target.value;
    onShippingInfoChange((prev) => {
      let ubigeo = '';
      if (districtName) {
        const dept = PERU_LOCATIONS.find((d) => d.name === prev.department);
        const prov = dept?.provinces.find((p) => p.name === prev.province);
        const dist = prov?.districts.find((d) => d.name === districtName);
        ubigeo = dist?.id ?? '';
      }
      return { ...prev, district: districtName, ubigeo };
    });
  };

  const handleCourierChange = (type: ShippingInfo['courier']) => {
    onShippingInfoChange((prev) => ({
      ...prev,
      courier: type,
      department: type === 'recojo' ? '' : prev.department,
      province: type === 'recojo' ? '' : prev.province,
      district: type === 'recojo' ? '' : prev.district,
      ubigeo: type === 'recojo' ? '' : prev.ubigeo,
      address: type === 'recojo' ? '' : prev.address,
      agency: type === 'recojo' ? '' : prev.agency,
    }));
  };

  // ── Render ──
  return (
    <div className={styles.stepContent}>
      <div className={styles.orderMiniSummary}>
        <p>
          Estas comprando <strong>{cartItems?.length || 0} productos</strong>
        </p>
        <p>
          Subtotal: <strong>S/ {totalAmount.toFixed(2)}</strong>
        </p>
      </div>

      <div className={styles.courierToggle}>
        <button
          className={`${styles.courierBtn} ${shippingInfo.courier === 'recojo' ? styles.courierActive : ''}`}
          onClick={() => handleCourierChange('recojo')}
        >
          <Icon>store</Icon>
          <span>Tienda</span>
        </button>
        <button
          className={`${styles.courierBtn} ${shippingInfo.courier === 'urbano_domicilio' ? styles.courierActive : ''}`}
          onClick={() => handleCourierChange('urbano_domicilio')}
        >
          <Icon>local_shipping</Icon>
          <span>ENVÍO</span>
        </button>
      </div>

      {shippingInfo.courier === 'recojo' ? (
        <div className={styles.pickupInfoCard}>
          <div className={styles.pickupHeader}>
            <Icon>location_on</Icon>
            <span>Direccion del Local</span>
          </div>
          <p className={styles.pickupAddress}>{businessAddress || 'Dirección no especificada'}</p>
          <p className={styles.pickupCity}>{businessCity || ''}</p>
          <div style={{ marginTop: '12px' }}>
            <input
              type="tel"
              placeholder="Tu Telefono de contacto (9 dígitos)"
              value={shippingInfo.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 9) onShippingInfoChange((prev) => ({ ...prev, phone: value }));
              }}
              className={`${styles.input} ${shippingInfo.phone.length > 0 && shippingInfo.phone.length !== 9 ? styles.inputError : ''}`}
              required
            />
          </div>
        </div>
      ) : (
        <>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <Select
                label="Departamento"
                outlined
                value={shippingInfo.department}
                onChange={handleDepartmentChange}
                options={departments}
              />
            </div>
            <div className={styles.formGroup}>
              <Select
                label="Provincia"
                outlined
                value={shippingInfo.province}
                onChange={handleProvinceChange}
                options={provinces}
                disabled={!shippingInfo.department}
              />
            </div>
            <div className={styles.formGroup}>
              <Select
                label="Distrito"
                outlined
                value={shippingInfo.district}
                onChange={handleDistrictChange}
                options={districts}
                disabled={!shippingInfo.province}
              />
            </div>
            <div className={styles.formGroup}>
              <input
                type="tel"
                placeholder="Telefono (9 dígitos)"
                value={shippingInfo.phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 9)
                    onShippingInfoChange((prev) => ({ ...prev, phone: value }));
                }}
                className={`${styles.input} ${shippingInfo.phone.length > 0 && shippingInfo.phone.length !== 9 ? styles.inputError : ''}`}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <input
              type="text"
              placeholder="Direccion exacta de entrega"
              value={shippingInfo.address}
              onChange={(e) =>
                onShippingInfoChange((prev) => ({ ...prev, address: e.target.value }))
              }
              className={styles.input}
              required
            />
          </div>
        </>
      )}
    </div>
  );
}
