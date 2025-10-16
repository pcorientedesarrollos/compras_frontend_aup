import { Component, Input, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { IconName, IconSize, IconVariant, ICON_SIZE_MAP, ICON_STROKE_WIDTH_MAP } from './types/icon.types';
import { getIconPath } from './icons';

/**
 * ============================================================================
 * 🎨 ICON COMPONENT - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Componente reutilizable para mostrar iconos SVG del sistema
 * 
 * CARACTERÍSTICAS:
 * - ✅ Standalone component (Angular 19)
 * - ✅ Signals para estado reactivo
 * - ✅ Sanitización de HTML
 * - ✅ TypeScript strict
 * - ✅ ~70 iconos disponibles
 * - ✅ 6 tamaños configurables
 * - ✅ Colores personalizables
 * 
 * USO BÁSICO:
 * <app-icon name="bee" size="md" />
 * 
 * USO AVANZADO:
 * <app-icon 
 *   name="honey" 
 *   size="xl" 
 *   color="text-honey-primary"
 *   [strokeWidth]="2"
 *   class="hover:scale-110 transition-transform"
 * />
 * 
 * ============================================================================
 */
@Component({
    selector: 'app-icon',
    standalone: true,
    imports: [CommonModule],
    template: `
    <svg 
      [class]="iconClasses()"
      fill="none" 
      viewBox="0 0 24 24" 
      [attr.stroke]="variant === 'outline' ? 'currentColor' : 'none'"
      [attr.fill]="variant === 'solid' ? 'currentColor' : 'none'"
      [attr.stroke-width]="computedStrokeWidth()"
      xmlns="http://www.w3.org/2000/svg">
      <g [innerHTML]="sanitizedIconPath()"></g>
    </svg>
    
    <!-- Debug info (solo en desarrollo) -->
    @if (debug && showDebugInfo()) {
      <div class="text-xs text-red-600 mt-1 font-mono">
        🐛 {{ name }} | {{ size }} | Path: {{ rawIconPath().substring(0, 30) }}...
      </div>
    }
  `,
    styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    
    svg {
      flex-shrink: 0;
    }

    /* Asegurar rendering correcto del SVG */
    svg * {
      vector-effect: non-scaling-stroke;
    }
  `]
})
export class IconComponent {
    private domSanitizer = inject(DomSanitizer);

    // ============================================================================
    // 🎯 INPUTS (Props del componente)
    // ============================================================================

    /**
     * Nombre del icono (requerido)
     * @example name="bee"
     */
    @Input({ required: true }) name!: IconName;

    /**
     * Tamaño del icono
     * @default 'md'
     */
    @Input() size: IconSize = 'md';

    /**
     * Variante del icono (solo outline por ahora)
     * @default 'outline'
     */
    @Input() variant: IconVariant = 'outline';

    /**
     * Color del icono (clase de Tailwind)
     * @example color="text-honey-primary"
     * @default undefined (hereda color del padre)
     */
    @Input() color?: string;

    /**
     * Grosor del stroke (override manual)
     * @default undefined (usa ICON_STROKE_WIDTH_MAP[size])
     */
    @Input() strokeWidth?: number;

    /**
     * Modo debug (muestra info del icono)
     * @default false
     */
    @Input() debug: boolean = false;

    // ============================================================================
    // 📊 ESTADO INTERNO (Signals)
    // ============================================================================

    /**
     * Clase CSS personalizada
     * @private
     */
    private _customClass = signal('');

    /**
     * Setter para clases adicionales
     */
    @Input()
    set class(value: string) {
        this._customClass.set(value);
    }

    // ============================================================================
    // ✨ COMPUTED PROPERTIES
    // ============================================================================

    /**
     * Path SVG crudo del icono
     * Incluye fallback a question-mark-circle si no existe
     */
    rawIconPath = computed(() => {
        const path = getIconPath(this.name, this.variant);

        if (!path) {
            console.warn(`⚠️ Icono "${this.name}" no encontrado. Usando fallback.`);
            return getIconPath('question-mark-circle', this.variant) || this.getHardcodedFallback();
        }

        return path;
    });

    /**
     * Path SVG sanitizado para Angular
     * Previene ataques XSS
     */
    sanitizedIconPath = computed((): SafeHtml => {
        const rawPath = this.rawIconPath();
        if (!rawPath) return '';

        return this.domSanitizer.bypassSecurityTrustHtml(rawPath);
    });

    /**
     * Clases CSS completas del icono
     * Combina: base + tamaño + color + custom
     */
    iconClasses = computed(() => {
        const baseClasses = 'flex-shrink-0';
        const sizeClass = ICON_SIZE_MAP[this.size];
        const colorClass = this.color || 'text-current';
        const customClass = this._customClass();

        return `${baseClasses} ${sizeClass} ${colorClass} ${customClass}`.trim();
    });

    /**
     * Stroke width computado
     * Usa strokeWidth manual o el default del tamaño
     */
    computedStrokeWidth = computed(() => {
        return this.strokeWidth !== undefined
            ? this.strokeWidth.toString()
            : ICON_STROKE_WIDTH_MAP[this.size].toString();
    });

    /**
     * Mostrar debug info
     */
    showDebugInfo = computed(() => {
        return this.debug && !!this.rawIconPath();
    });

    // ============================================================================
    // 🔧 MÉTODOS PÚBLICOS
    // ============================================================================

    /**
     * Cambiar tamaño dinámicamente
     * @example icon.setSize('xl')
     */
    setSize(size: IconSize): void {
        this.size = size;
    }

    /**
     * Cambiar color dinámicamente
     * @example icon.setColor('text-red-500')
     */
    setColor(color: string): void {
        this.color = color;
    }

    /**
     * Cambiar variante dinámicamente
     * @example icon.setVariant('solid')
     */
    setVariant(variant: IconVariant): void {
        this.variant = variant;
    }

    // ============================================================================
    // 🛡️ MÉTODOS PRIVADOS
    // ============================================================================

    /**
     * Fallback hardcoded para emergencias
     * Question mark circle
     * @private
     */
    private getHardcodedFallback(): string {
        return `<path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />`;
    }
}