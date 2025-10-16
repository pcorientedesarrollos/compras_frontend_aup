/**
 * ============================================================================
 * ✏️ EDITABLE CELL COMPONENT - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Celda editable inline para tablas
 * 
 * FEATURES:
 * - Click para editar
 * - Enter → Guardar
 * - Escape → Cancelar
 * - Blur → Guardar
 * - Validación inline
 * - Loading state
 * - Auto-uppercase (RFC, CURP)
 * - Validaciones: required, email, rfc, curp, custom regex
 * 
 * USO:
 * <app-editable-cell
 *   [value]="row.nombre"
 *   [config]="{ type: 'text', validation: 'required' }"
 *   (save)="onSave($event)"
 *   (cancel)="onCancel()">
 * </app-editable-cell>
 * 
 * ============================================================================
 */

import { Component, computed, input, output, signal, effect, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../ui/icon/icon.component';
import { EditConfig } from '../honey-table/types/table.types';

@Component({
    selector: 'app-editable-cell',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        IconComponent
    ],
    templateUrl: './editable-cell.component.html',
    styleUrl: './editable-cell.component.css'
})
export class EditableCellComponent {

    // ============================================================================
    // VIEW CHILDREN
    // ============================================================================

    inputElement = viewChild<ElementRef<HTMLInputElement>>('inputRef');

    // ============================================================================
    // INPUTS
    // ============================================================================

    /** Valor actual */
    value = input.required<any>();

    /** Configuración de edición */
    config = input<EditConfig>({});

    /** Estado de carga (guardando) */
    saving = input<boolean>(false);

    // ============================================================================
    // OUTPUTS
    // ============================================================================

    /** Evento cuando se guarda el valor */
    save = output<any>();

    /** Evento cuando se cancela la edición */
    cancel = output<void>();

    // ============================================================================
    // STATE
    // ============================================================================

    /** Valor temporal durante edición */
    tempValue = signal<string>('');

    /** Mensaje de error de validación */
    validationError = signal<string | null>(null);

    // ============================================================================
    // COMPUTED
    // ============================================================================

    /** Configuración con defaults */
    editConfig = computed(() => ({
        type: 'text' as const,
        validation: undefined,
        maxLength: undefined,
        uppercase: false,
        placeholder: '',
        ...this.config()
    }));

    /** Input type HTML */
    inputType = computed(() => {
        const type = this.editConfig().type;
        return type === 'number' ? 'number' :
            type === 'email' ? 'email' : 'text';
    });

    /** Si el valor es válido */
    isValid = computed(() => this.validationError() === null);

    /** Si se puede guardar (válido y valor cambió) */
    canSave = computed(() => {
        return this.isValid() &&
            this.tempValue() !== this.formatValue(this.value());
    });

    // ============================================================================
    // EFFECTS
    // ============================================================================

    constructor() {
        // Inicializar valor temporal cuando cambia el valor
        effect(() => {
            this.tempValue.set(this.formatValue(this.value()));
        });

        // Auto-focus en el input cuando se monta
        effect(() => {
            const input = this.inputElement();
            if (input) {
                setTimeout(() => {
                    input.nativeElement.focus();
                    input.nativeElement.select();
                }, 0);
            }
        });
    }

    // ============================================================================
    // METHODS - ACTIONS
    // ============================================================================

    onInputChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        let newValue = input.value;

        // Auto-uppercase si está configurado
        if (this.editConfig().uppercase) {
            newValue = newValue.toUpperCase();
            // Actualizar el input con el valor en mayúsculas
            input.value = newValue;
        }

        this.tempValue.set(newValue);
        this.validate();
    }

    onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.handleSave();
        } else if (event.key === 'Escape') {
            event.preventDefault();
            this.handleCancel();
        }
    }

    onBlur(): void {
        // Solo guardar en blur si el valor es válido y cambió
        if (this.canSave() && !this.saving()) {
            this.handleSave();
        }
    }

    handleSave(): void {
        if (!this.canSave() || this.saving()) {
            return;
        }

        const finalValue = this.parseValue(this.tempValue());
        this.save.emit(finalValue);
    }

    handleCancel(): void {
        this.cancel.emit();
    }

    // ============================================================================
    // METHODS - VALIDATION
    // ============================================================================

    validate(): void {
        const value = this.tempValue();
        const validation = this.editConfig().validation;

        // Sin validación
        if (!validation) {
            this.validationError.set(null);
            return;
        }

        // Required
        if (validation === 'required') {
            if (!value || value.trim() === '') {
                this.validationError.set('Este campo es requerido');
                return;
            }
        }

        // Email
        if (validation === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                this.validationError.set('Email inválido');
                return;
            }
        }

        // RFC
        if (validation === 'rfc') {
            const rfcRegex = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
            if (!rfcRegex.test(value.toUpperCase())) {
                this.validationError.set('RFC inválido (ej: PEGJ800101ABC)');
                return;
            }
        }

        // CURP
        if (validation === 'curp') {
            const curpRegex = /^[A-Z]{4}[0-9]{6}[HM]{1}[A-Z]{2}[BCDFGHJKLMNPQRSTVWXYZ]{3}[0-9A-Z]{2}$/;
            if (!curpRegex.test(value.toUpperCase())) {
                this.validationError.set('CURP inválido (18 caracteres)');
                return;
            }
        }

        // Custom RegExp
        if (validation instanceof RegExp) {
            if (!validation.test(value)) {
                this.validationError.set('Formato inválido');
                return;
            }
        }

        // Validación exitosa
        this.validationError.set(null);
    }

    // ============================================================================
    // METHODS - FORMATTERS
    // ============================================================================

    formatValue(value: any): string {
        if (value === null || value === undefined) {
            return '';
        }
        return String(value);
    }

    parseValue(value: string): any {
        const type = this.editConfig().type;

        if (type === 'number') {
            const num = parseFloat(value);
            return isNaN(num) ? null : num;
        }

        return value.trim();
    }
}