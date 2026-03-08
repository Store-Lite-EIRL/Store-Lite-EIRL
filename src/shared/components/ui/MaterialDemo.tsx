'use client';

import { ThemeSettings } from '@/shared/components/ui/ThemeSettings';
import { closeElementById, showElementById, showNextSiblingElement } from '@/shared/utils';

// eslint-disable-next-line max-lines-per-function
export default function MaterialDemo() {
  return (
    <div className="page-container">
      <ThemeSettings />
      <section className="section">
        <h2 className="section-title">Button group</h2>
        <div className="row">
          <md-filled-button>Guardar</md-filled-button>
          <md-outlined-button>Cancelar</md-outlined-button>
          <md-text-button>Enlace</md-text-button>
          <md-filled-tonal-button>Tonal</md-filled-tonal-button>
          <md-elevated-button>Elevado</md-elevated-button>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Icon buttons</h2>
        <div className="row row--align-center">
          <md-icon-button aria-label="Icon" suppressHydrationWarning>
            <md-icon slot="icon" suppressHydrationWarning>
              star
            </md-icon>
          </md-icon-button>
          <md-filled-icon-button aria-label="Filled" suppressHydrationWarning>
            <md-icon slot="icon" suppressHydrationWarning>
              favorite
            </md-icon>
          </md-filled-icon-button>
          <md-outlined-icon-button aria-label="Outlined" suppressHydrationWarning>
            <md-icon slot="icon" suppressHydrationWarning>
              delete
            </md-icon>
          </md-outlined-icon-button>
          <md-filled-tonal-icon-button aria-label="Tonal" suppressHydrationWarning>
            <md-icon slot="icon" suppressHydrationWarning>
              add
            </md-icon>
          </md-filled-tonal-icon-button>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Checkbox</h2>
        <div className="row row--align-center">
          <md-checkbox touch-target="wrapper">Sin marcar</md-checkbox>
          <md-checkbox touch-target="wrapper" checked>
            Marcado
          </md-checkbox>
          <md-checkbox touch-target="wrapper" indeterminate>
            Indeterminado
          </md-checkbox>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Campos de texto (TextField)</h2>
        <div className="form-row">
          <md-outlined-text-field label="Outlined" placeholder="Escribe aquÃ­" />
          <md-filled-text-field label="Filled" placeholder="Escribe aquÃ­" />
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Campos (Field)</h2>
        <div className="form-row form-row--fields">
          <md-outlined-field label="Outlined field">
            <input slot="input" type="text" placeholder="Placeholder" />
          </md-outlined-field>
          <md-filled-field label="Filled field">
            <input slot="input" type="text" placeholder="Placeholder" />
          </md-filled-field>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Switch y Slider</h2>
        <div className="row row--vertical">
          <label className="field-label">
            <md-switch />
            <span>Switch</span>
          </label>
          <label className="field-label">
            <md-switch selected />
            <span>Switch activado</span>
          </label>
          <div className="form-row">
            <span>Slider</span>
            <md-slider value="50" min="0" max="100" />
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Radio</h2>
        <div className="row row--vertical">
          <label className="field-label">
            <md-radio name="opcion" value="a" />
            <span>OpciÃ³n A</span>
          </label>
          <label className="field-label">
            <md-radio name="opcion" value="b" checked />
            <span>OpciÃ³n B</span>
          </label>
          <label className="field-label">
            <md-radio name="opcion" value="c" />
            <span>OpciÃ³n C</span>
          </label>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Chips</h2>
        <div className="row">
          <md-assist-chip label="Assist" />
          <md-filter-chip label="Filter" selected />
          <md-suggestion-chip label="Suggestion" />
          <md-input-chip label="Input" removable />
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Chip set</h2>
        <md-chip-set>
          <md-assist-chip label="Uno" />
          <md-assist-chip label="Dos" />
          <md-filter-chip label="Filtro A" />
          <md-filter-chip label="Filtro B" selected />
        </md-chip-set>
      </section>

      <section className="section">
        <h2 className="section-title">Progress</h2>
        <div className="progress-row">
          <md-linear-progress value="0.7" />
          <md-circular-progress value="0.6" className="circular-progress-wrap" />
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Divider</h2>
        <md-divider />
      </section>

      <section className="section">
        <h2 className="section-title">FAB</h2>
        <div className="row">
          <md-fab label="FAB" />
          <md-branded-fab label="Branded" />
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Dialog</h2>
        <md-dialog id="demo-dialog">
          <div slot="headline">TÃ­tulo del diÃ¡logo</div>
          <div slot="content">Contenido del diÃ¡logo. Cierra con Cancelar u Ok.</div>
          <div slot="actions">
            <md-text-button
              onClick={() =>
                closeElementById('demo-dialog')
              }
            >
              Cancelar
            </md-text-button>
            <md-filled-button
              onClick={() =>
                closeElementById('demo-dialog')
              }
            >
              Ok
            </md-filled-button>
          </div>
        </md-dialog>
        <md-filled-button
          onClick={() =>
            showElementById('demo-dialog')
          }
        >
          Abrir diÃ¡logo
        </md-filled-button>
      </section>

      <section className="section">
        <h2 className="section-title">Menu</h2>
        <div className="row">
          <md-filled-button
            id="menu-anchor"
            onClick={(e: React.MouseEvent<HTMLElement>) =>
              showNextSiblingElement(e.currentTarget)
            }
          >
            Abrir menÃº
          </md-filled-button>
          <md-menu anchor="menu-anchor" positioning="popover">
            <md-menu-item>
              <span slot="headline">OpciÃ³n 1</span>
            </md-menu-item>
            <md-menu-item>
              <span slot="headline">OpciÃ³n 2</span>
            </md-menu-item>
            <md-menu-item>
              <span slot="headline">OpciÃ³n 3</span>
            </md-menu-item>
          </md-menu>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Tabs (Primary)</h2>
        <md-tabs>
          <md-primary-tab value="tab1" selected>
            Tab 1
          </md-primary-tab>
          <md-primary-tab value="tab2">Tab 2</md-primary-tab>
          <md-primary-tab value="tab3">Tab 3</md-primary-tab>
        </md-tabs>
      </section>

      <section className="section">
        <h2 className="section-title">Tabs (Secondary)</h2>
        <md-tabs>
          <md-secondary-tab value="sec1" selected>
            Secundario 1
          </md-secondary-tab>
          <md-secondary-tab value="sec2">Secundario 2</md-secondary-tab>
          <md-secondary-tab value="sec3">Secundario 3</md-secondary-tab>
        </md-tabs>
      </section>

      <section className="section">
        <h2 className="section-title">Select (Outlined)</h2>
        <md-outlined-select label="Selecciona" className="select-wrap">
          <md-select-option value="1" selected>
            OpciÃ³n 1
          </md-select-option>
          <md-select-option value="2">OpciÃ³n 2</md-select-option>
          <md-select-option value="3">OpciÃ³n 3</md-select-option>
        </md-outlined-select>
      </section>

      <section className="section">
        <h2 className="section-title">Select (Filled)</h2>
        <md-filled-select label="Selecciona" className="select-wrap">
          <md-select-option value="a" selected>
            OpciÃ³n A
          </md-select-option>
          <md-select-option value="b">OpciÃ³n B</md-select-option>
          <md-select-option value="c">OpciÃ³n C</md-select-option>
        </md-filled-select>
      </section>

      <section className="section">
        <h2 className="section-title">Lista</h2>
        <md-list>
          <md-list-item>
            <span slot="headline">Elemento 1</span>
          </md-list-item>
          <md-list-item>
            <span slot="headline">Elemento 2</span>
          </md-list-item>
          <md-list-item>
            <span slot="headline">Elemento 3</span>
          </md-list-item>
        </md-list>
      </section>

      <section className="section">
        <h2 className="section-title">Icon</h2>
        <div className="row row--align-center">
          <md-icon>home</md-icon>
          <md-icon>settings</md-icon>
          <md-icon>favorite</md-icon>
          <md-icon>search</md-icon>
        </div>
      </section>
    </div>
  );
}


