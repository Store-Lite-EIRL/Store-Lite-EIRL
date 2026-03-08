'use client';

import { ThemeSettings } from '@/shared/components/ui/ThemeSettings';
import { closeElementById, showElementById, showNextSiblingElement } from '@/shared/utils';

// eslint-disable-next-line max-lines-per-function
export default function TestComponents() {
  return (
    <div className="page-container">
      <ThemeSettings />
      <section className="section">
        <h2 className="section-title">Button group</h2>
        <div className="row">
          <md-filled-button suppressHydrationWarning>Guardar</md-filled-button>
          <md-outlined-button suppressHydrationWarning>Cancelar</md-outlined-button>
          <md-text-button suppressHydrationWarning>Enlace</md-text-button>
          <md-filled-tonal-button suppressHydrationWarning>Tonal</md-filled-tonal-button>
          <md-elevated-button suppressHydrationWarning>Elevado</md-elevated-button>
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
          <md-checkbox touch-target="wrapper" suppressHydrationWarning>
            Sin marcar
          </md-checkbox>
          <md-checkbox touch-target="wrapper" checked suppressHydrationWarning>
            Marcado
          </md-checkbox>
          <md-checkbox touch-target="wrapper" indeterminate suppressHydrationWarning>
            Indeterminado
          </md-checkbox>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Campos de texto (TextField)</h2>
        <div className="form-row">
          <md-outlined-text-field
            label="Outlined"
            placeholder="Escribe aquÃ­"
            suppressHydrationWarning
          />
          <md-filled-text-field
            label="Filled"
            placeholder="Escribe aquÃ­"
            suppressHydrationWarning
          />
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Campos (Field)</h2>
        <div className="form-row form-row--fields">
          <md-outlined-field label="Outlined field" suppressHydrationWarning>
            <input slot="input" type="text" placeholder="Placeholder" />
          </md-outlined-field>
          <md-filled-field label="Filled field" suppressHydrationWarning>
            <input slot="input" type="text" placeholder="Placeholder" />
          </md-filled-field>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Switch y Slider</h2>
        <div className="row row--vertical">
          <label className="field-label">
            <md-switch suppressHydrationWarning />
            <span>Switch</span>
          </label>
          <label className="field-label">
            <md-switch selected suppressHydrationWarning />
            <span>Switch activado</span>
          </label>
          <div className="form-row">
            <span>Slider</span>
            <md-slider value="50" min="0" max="100" suppressHydrationWarning />
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Radio</h2>
        <div className="row row--vertical">
          <label className="field-label">
            <md-radio name="opcion" value="a" suppressHydrationWarning />
            <span>OpciÃ³n A</span>
          </label>
          <label className="field-label">
            <md-radio name="opcion" value="b" checked suppressHydrationWarning />
            <span>OpciÃ³n B</span>
          </label>
          <label className="field-label">
            <md-radio name="opcion" value="c" suppressHydrationWarning />
            <span>OpciÃ³n C</span>
          </label>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Chips</h2>
        <div className="row">
          <md-assist-chip label="Assist" suppressHydrationWarning />
          <md-filter-chip label="Filter" selected suppressHydrationWarning />
          <md-suggestion-chip label="Suggestion" suppressHydrationWarning />
          <md-input-chip label="Input" removable suppressHydrationWarning />
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Chip set</h2>
        <md-chip-set suppressHydrationWarning>
          <md-assist-chip label="Uno" suppressHydrationWarning />
          <md-assist-chip label="Dos" suppressHydrationWarning />
          <md-filter-chip label="Filtro A" suppressHydrationWarning />
          <md-filter-chip label="Filtro B" selected suppressHydrationWarning />
        </md-chip-set>
      </section>

      <section className="section">
        <h2 className="section-title">Progress</h2>
        <div className="progress-row">
          <md-linear-progress value="0.7" suppressHydrationWarning />
          <md-circular-progress
            value="0.6"
            className="circular-progress-wrap"
            suppressHydrationWarning
          />
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Divider</h2>
        <md-divider suppressHydrationWarning />
      </section>

      <section className="section">
        <h2 className="section-title">FAB</h2>
        <div className="row">
          <md-fab label="FAB" suppressHydrationWarning />
          <md-branded-fab label="Branded" suppressHydrationWarning />
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
          <md-menu anchor="menu-anchor" positioning="popover" suppressHydrationWarning>
            <md-menu-item suppressHydrationWarning>
              <span slot="headline">OpciÃ³n 1</span>
            </md-menu-item>
            <md-menu-item suppressHydrationWarning>
              <span slot="headline">OpciÃ³n 2</span>
            </md-menu-item>
            <md-menu-item suppressHydrationWarning>
              <span slot="headline">OpciÃ³n 3</span>
            </md-menu-item>
          </md-menu>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Tabs (Primary)</h2>
        <md-tabs suppressHydrationWarning>
          <md-primary-tab value="tab1" selected suppressHydrationWarning>
            Tab 1
          </md-primary-tab>
          <md-primary-tab value="tab2" suppressHydrationWarning>
            Tab 2
          </md-primary-tab>
          <md-primary-tab value="tab3" suppressHydrationWarning>
            Tab 3
          </md-primary-tab>
        </md-tabs>
      </section>

      <section className="section">
        <h2 className="section-title">Tabs (Secondary)</h2>
        <md-tabs suppressHydrationWarning>
          <md-secondary-tab value="sec1" selected suppressHydrationWarning>
            Secundario 1
          </md-secondary-tab>
          <md-secondary-tab value="sec2" suppressHydrationWarning>
            Secundario 2
          </md-secondary-tab>
          <md-secondary-tab value="sec3" suppressHydrationWarning>
            Secundario 3
          </md-secondary-tab>
        </md-tabs>
      </section>

      <section className="section">
        <h2 className="section-title">Select (Outlined)</h2>
        <md-outlined-select label="Selecciona" className="select-wrap" suppressHydrationWarning>
          <md-select-option value="1" selected suppressHydrationWarning>
            OpciÃ³n 1
          </md-select-option>
          <md-select-option value="2" suppressHydrationWarning>
            OpciÃ³n 2
          </md-select-option>
          <md-select-option value="3" suppressHydrationWarning>
            OpciÃ³n 3
          </md-select-option>
        </md-outlined-select>
      </section>

      <section className="section">
        <h2 className="section-title">Select (Filled)</h2>
        <md-filled-select label="Selecciona" className="select-wrap" suppressHydrationWarning>
          <md-select-option value="a" selected suppressHydrationWarning>
            OpciÃ³n A
          </md-select-option>
          <md-select-option value="b" suppressHydrationWarning>
            OpciÃ³n B
          </md-select-option>
          <md-select-option value="c" suppressHydrationWarning>
            OpciÃ³n C
          </md-select-option>
        </md-filled-select>
      </section>

      <section className="section">
        <h2 className="section-title">Lista</h2>
        <md-list suppressHydrationWarning>
          <md-list-item suppressHydrationWarning>
            <span slot="headline">Elemento 1</span>
          </md-list-item>
          <md-list-item suppressHydrationWarning>
            <span slot="headline">Elemento 2</span>
          </md-list-item>
          <md-list-item suppressHydrationWarning>
            <span slot="headline">Elemento 3</span>
          </md-list-item>
        </md-list>
      </section>

      <section className="section">
        <h2 className="section-title">Icon</h2>
        <div className="row row--align-center">
          <md-icon suppressHydrationWarning>home</md-icon>
          <md-icon suppressHydrationWarning>settings</md-icon>
          <md-icon suppressHydrationWarning>favorite</md-icon>
          <md-icon suppressHydrationWarning>search</md-icon>
        </div>
      </section>
    </div>
  );
}

