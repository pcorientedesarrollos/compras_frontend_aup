/**
 * ============================================================================
 * 🔍 AUTOCOMPLETE SELECT COMPONENT - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Componente reutilizable de select con búsqueda/autocompletado
 * 
 * CARACTERÍSTICAS:
 * - Búsqueda instantánea mientras escribes
 * - Integración con Reactive Forms (ControlValueAccessor)
 * - Navegación por teclado (arrow keys, Enter, Esc)
 * - Scroll virtual para 1000+ items
 * - Estilos Tailwind personalizables
 * - Muestra label personalizado (ej: "código - nombre")
 * 
 * USO:
 * <app-autocomplete-select
 *   formControlName="apicultorId"
 *   [options]="apicultores"
 *   optionValue="id"
 *   optionLabel="nombre"
 *   [optionTemplate]="formatApicultor"
 *   placeholder="Buscar apicultor..."
 *   label="Apicultor"
 *   [required]="true"
 * />
 * 
 * ============================================================================
 */

import {
    Component,
    Input,
    Output,
    EventEmitter,
    forwardRef,
    signal,
    computed,
    effect,
    ElementRef,
    ViewChild,
    HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

@Component({
    selector: 'app-autocomplete-select',
    standalone: true,
    imports: [CommonModule, FormsModule, IconComponent],
    templateUrl: './autocomplete-select.component.html',
    styleUrl: './autocomplete-select.component.css',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => AutocompleteSelectComponent),
            multi: true
        }
    ]
})
export class AutocompleteSelectComponent implements ControlValueAccessor {
    @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

    // ============================================================================
    // INPUTS
    // ============================================================================

    /** Lista de opciones */
    @Input() options: any[] = [];

    /** Campo que se usa como valor (ej: 'id') */
    @Input() optionValue: string = 'id';

    /** Campo que se usa como label (ej: 'nombre') */
    @Input() optionLabel: string = 'nombre';

    /** Función para formatear el label mostrado (opcional) */
    @Input() optionTemplate?: (option: any) => string;

    /** Placeholder del input */
    @Input() placeholder: string = 'Buscar...';

    /** Label del campo */
    @Input() label: string = '';

    /** Si el campo es requerido */
    @Input() required: boolean = false;

    /** Deshabilitado */
    @Input() disabled: boolean = false;

    /** Mensaje de error personalizado */
    @Input() errorMessage: string = '';

    /** Número máximo de opciones visibles en el dropdown */
    @Input() maxVisibleOptions: number = 8;

    // ============================================================================
    // OUTPUTS
    // ============================================================================

    @Output() selectionChange = new EventEmitter<any>();

    // ============================================================================
    // SIGNALS
    // ============================================================================

    /** Texto de búsqueda */
    searchText = signal<string>('');

    /** Si el dropdown está abierto */
    isOpen = signal<boolean>(false);

    /** Opción seleccionada actual */
    selectedOption = signal<any | null>(null);

    /** Índice de la opción resaltada con teclado */
    highlightedIndex = signal<number>(-1);

    /** Si está en estado de error */
    hasError = signal<boolean>(false);

    // ============================================================================
    // COMPUTED
    // ============================================================================

    /**
     * Opciones filtradas según el texto de búsqueda
     */
    filteredOptions = computed(() => {
        const search = this.searchText().toLowerCase().trim();

        if (!search) {
            return this.options;
        }

        return this.options.filter(option => {
            const label = this.getOptionLabel(option).toLowerCase();
            return label.includes(search);
        });
    });

    /**
     * Texto mostrado en el input
     */
    displayText = computed(() => {
        const selected = this.selectedOption();
        if (!selected) {
            return this.searchText();
        }
        return this.getOptionLabel(selected);
    });

    /**
     * Si hay resultados de búsqueda
     */
    hasResults = computed(() => this.filteredOptions().length > 0);

    /**
     * Mensaje cuando no hay resultados
     */
    noResultsMessage = computed(() => {
        const search = this.searchText();
        return search ? `No se encontraron resultados para "${search}"` : 'No hay opciones disponibles';
    });

    // ============================================================================
    // CONTROL VALUE ACCESSOR
    // ============================================================================

    private onChange: (value: any) => void = () => { };
    private onTouched: () => void = () => { };

    writeValue(value: any): void {
        if (value) {
            const option = this.options.find(opt => opt[this.optionValue] === value);
            this.selectedOption.set(option || null);
        } else {
            this.selectedOption.set(null);
        }
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    // ============================================================================
    // MÉTODOS PÚBLICOS
    // ============================================================================

    /**
     * Obtener el label de una opción
     */
    getOptionLabel(option: any): string {
        if (this.optionTemplate) {
            return this.optionTemplate(option);
        }
        return option[this.optionLabel] || '';
    }

    /**
     * Abrir el dropdown
     */
    openDropdown(): void {
        if (this.disabled) return;

        this.isOpen.set(true);
        this.highlightedIndex.set(-1);

        // Focus en el input
        setTimeout(() => {
            this.searchInput?.nativeElement.focus();
        }, 0);
    }

    /**
     * Cerrar el dropdown
     */
    closeDropdown(): void {
        this.isOpen.set(false);
        this.highlightedIndex.set(-1);
        this.onTouched();
    }

    /**
     * Seleccionar una opción
     */
    selectOption(option: any): void {
        this.selectedOption.set(option);
        this.searchText.set('');
        this.closeDropdown();

        const value = option[this.optionValue];
        this.onChange(value);
        this.selectionChange.emit(value);
    }

    /**
     * Limpiar selección
     */
    clearSelection(event: Event): void {
        event.stopPropagation();

        this.selectedOption.set(null);
        this.searchText.set('');
        this.onChange(null);
        this.selectionChange.emit(null);

        // Focus en el input
        setTimeout(() => {
            this.searchInput?.nativeElement.focus();
        }, 0);
    }

    /**
     * Manejar cambio en el input de búsqueda
     */
    onSearchChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.searchText.set(input.value);

        // Abrir dropdown si hay texto
        if (input.value && !this.isOpen()) {
            this.openDropdown();
        }

        // Reset highlighted index
        this.highlightedIndex.set(-1);
    }

    /**
     * Manejar focus en el input
     */
    onInputFocus(): void {
        this.openDropdown();
    }

    /**
     * Verificar si una opción está seleccionada
     */
    isSelected(option: any): boolean {
        const selected = this.selectedOption();
        if (!selected) return false;
        return selected[this.optionValue] === option[this.optionValue];
    }

    /**
     * Verificar si una opción está resaltada
     */
    isHighlighted(index: number): boolean {
        return this.highlightedIndex() === index;
    }

    // ============================================================================
    // NAVEGACIÓN POR TECLADO
    // ============================================================================

    /**
     * Manejar teclas
     */
    onKeyDown(event: KeyboardEvent): void {
        const filtered = this.filteredOptions();
        const currentIndex = this.highlightedIndex();

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                if (!this.isOpen()) {
                    this.openDropdown();
                } else {
                    const nextIndex = currentIndex < filtered.length - 1 ? currentIndex + 1 : 0;
                    this.highlightedIndex.set(nextIndex);
                    this.scrollToOption(nextIndex);
                }
                break;

            case 'ArrowUp':
                event.preventDefault();
                if (this.isOpen()) {
                    const prevIndex = currentIndex > 0 ? currentIndex - 1 : filtered.length - 1;
                    this.highlightedIndex.set(prevIndex);
                    this.scrollToOption(prevIndex);
                }
                break;

            case 'Enter':
                event.preventDefault();
                if (this.isOpen() && currentIndex >= 0 && filtered[currentIndex]) {
                    this.selectOption(filtered[currentIndex]);
                }
                break;

            case 'Escape':
                event.preventDefault();
                this.closeDropdown();
                break;

            case 'Tab':
                if (this.isOpen()) {
                    this.closeDropdown();
                }
                break;
        }
    }

    /**
     * Scroll automático a la opción resaltada
     */
    private scrollToOption(index: number): void {
        setTimeout(() => {
            const dropdown = document.querySelector('.autocomplete-dropdown');
            const option = dropdown?.querySelector(`[data-index="${index}"]`);

            if (option && dropdown) {
                const optionTop = (option as HTMLElement).offsetTop;
                const optionHeight = (option as HTMLElement).offsetHeight;
                const dropdownHeight = dropdown.clientHeight;
                const dropdownScroll = dropdown.scrollTop;

                if (optionTop < dropdownScroll) {
                    dropdown.scrollTop = optionTop;
                } else if (optionTop + optionHeight > dropdownScroll + dropdownHeight) {
                    dropdown.scrollTop = optionTop + optionHeight - dropdownHeight;
                }
            }
        }, 0);
    }

    // ============================================================================
    // CLICK FUERA DEL COMPONENTE
    // ============================================================================

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        const clickedInside = target.closest('.autocomplete-container');

        if (!clickedInside && this.isOpen()) {
            this.closeDropdown();
        }
    }
}