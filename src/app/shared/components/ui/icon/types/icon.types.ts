/**
 * ============================================================================
 * 🎯 ICON TYPES - SISTEMA OAXACA MIEL
 * ============================================================================
 * 
 * Definiciones de tipos TypeScript para el sistema de iconos.
 * MAPEA TODOS LOS EMOJIS DEL SISTEMA A ICONOS SVG
 * 
 * 📊 ESTADÍSTICAS:
 * - Total de iconos: ~70
 * - Categorías: 7
 * - Variantes: outline (stroke)
 * 
 * ✅ Reemplaza: 🍯🐝🏢👑📊🗺️➕✅❌ y más...
 * 
 * ============================================================================
 */

/**
 * Nombres válidos de iconos disponibles en el sistema
 */
export type IconName =
    // ============================================================================
    // 🍯 CATEGORÍA 1: IDENTIDAD OAXACA MIEL
    // ============================================================================
    | 'honey'                    // 🍯 Logo principal, producto
    | 'bee'                      // 🐝 Apicultor, colmenas
    | 'hive'                     // 🏠 Apiario
    | 'flower'                   // 🌼 Flora, naturaleza

    // ============================================================================
    // 👤 CATEGORÍA 2: ROLES Y USUARIOS
    // ============================================================================
    | 'crown'                    // 👑 Administrador
    | 'building-office'          // 🏢 Acopiador/Mielera/Proveedor
    | 'user'                     // 👤 Usuario genérico
    | 'user-circle'              // 💤 Perfil usuario
    | 'users'                    // 👥 Múltiples usuarios
    | 'user-group'               // Grupo de usuarios
    | 'user-plus'                // Agregar usuario
    | 'user-minus'               // Remover usuario
    | 'identification'           // Identificación (CURP, RFC)
    | 'shield-check'             // 🛡️ Certificaciones Senasica/IPP

    // ============================================================================
    // 🏠 CATEGORÍA 3: NAVEGACIÓN Y MENÚ
    // ============================================================================
    | 'home'                     // 🏠 Inicio
    | 'dashboard'                // 📊 Dashboard
    | 'menu'                     // ☰ Hamburger menu
    | 'bars-3'                   // Alias de menu
    | 'x-mark'                   // ✕ Cerrar
    | 'chevron-down'             // ⌄ Dropdown
    | 'chevron-up'               // ⌃ Subir
    | 'chevron-left'             // ‹ Izquierda
    | 'chevron-right'            // › Derecha/navegación
    | 'arrow-left'               // ← Regresar
    | 'arrow-right'              // → Siguiente
    | 'arrow-up'                 // ↑ Arriba
    | 'arrow-down'               // ↓ Abajo
    | 'ellipsis-vertical'        
    | 'ellipsis-horizontal'
    
    
    // ============================================================================
    // 📊 CATEGORÍA 4: DASHBOARD Y MÉTRICAS
    // ============================================================================
    | 'chart-bar'                // 📊 Gráficos
    | 'chart-pie'                // Gráfico de pastel
    | 'presentation-chart-line'  // Presentaciones
    | 'arrow-trending-up'        // 📈 Tendencia positiva
    | 'arrow-trending-down'      // 📉 Tendencia negativa
    | 'calculator'               // Calculadora/métricas
    | 'table-cells'              // Tablas/celdas

    // ============================================================================
    // 🗺️ CATEGORÍA 5: UBICACIÓN Y MAPAS
    // ============================================================================
    | 'map'                      // 🗺️ Mapa general
    | 'map-pin'                  // 📍🏞️ Ubicación apiario
    | 'globe-alt'                // Mundo/región
    | 'location-marker'          // Marcador ubicación
    | 'building-library'         // Edificio institucional

    // ============================================================================
    // 📁 CATEGORÍA 6: DOCUMENTOS Y GESTIÓN
    // ============================================================================
    | 'document'                 // 📄 Documento genérico
    | 'document-text'            // 📋 Documento con texto
    | 'document-plus'            // Crear documento
    | 'document-check'           // ✅ Documento verificado
    | 'document-arrow-up'        // Subir documento
    | 'document-arrow-down'      // Descargar documento
    | 'document-duplicate'       // Duplicar documento
    | 'folder'                   // Carpeta
    | 'folder-open'              // Carpeta abierta
    | 'clipboard'                // Portapapeles
    | 'paper-clip'               // Adjunto

    // ============================================================================
    // ⚙️ CATEGORÍA 7: ACCIONES Y OPERACIONES
    // ============================================================================
    | 'plus'                     // ➕ Agregar/Crear
    | 'minus'                    // Restar/Remover
    | 'pencil'                   // ✏️ Editar
    | 'trash'                    // 🗑️ Eliminar
    | 'magnifying-glass'         // 🔍 Buscar
    | 'cog-6-tooth'              // ⚙️ Configuración
    | 'cog'                      // Alias de configuración
    | 'link'                     // 🔗 Vincular
    | 'arrow-path'               // 🔄 Actualizar/Recargar
    | 'funnel'                   // Filtrar
    | 'adjustments-horizontal'   // Ajustes
    | 'arrows-up-down'           // Ordenar
    | 'printer'                  // Imprimir
    | 'arrow-down-tray'          // Descargar
    | 'arrow-up-tray'            // Subir/Upload
    | 'squares-plus'             // Agregar módulo

    // ============================================================================
    // ✅ CATEGORÍA 8: ESTADOS Y VALIDACIÓN
    // ============================================================================
    | 'check'                    // ✅ Confirmación
    | 'check-circle'             // ✅ Estado activo
    | 'x-circle'                 // ❌ Estado inactivo/error
    | 'exclamation-triangle'     // ⚠️ Advertencia
    | 'exclamation-circle'       // ⚠️ Alerta
    | 'information-circle'       // ℹ️ Información
    | 'question-mark-circle'     // ❓ Ayuda
    | 'clock'                    // 🕐 Tiempo/Historial
    | 'eye'                      // 👁️ Ver/Visualizar
    | 'eye-slash'                // Ocultar
    | 'hand-thumb-up'            // Aprobar
    | 'hand-thumb-down'          // Rechazar

    // ============================================================================
    // 🔔 CATEGORÍA 9: NOTIFICACIONES Y COMUNICACIÓN
    // ============================================================================
    | 'bell'                     // 🔔 Notificaciones
    | 'bell-alert'               // Notificación urgente
    | 'bell-slash'               // Notificaciones off
    | 'inbox'                    // Bandeja entrada
    | 'phone'                    // 📞 Teléfono
    | 'envelope'                 // ✉️ Email
    | 'chat-bubble-left'         // 💬 Mensajes
    | 'at-symbol'                // @ Email

    // ============================================================================
    // 💰 CATEGORÍA 10: FINANZAS Y COMERCIO
    // ============================================================================
    | 'currency-dollar'          // 💰 Dinero/Precio
    | 'banknotes'                // Billetes
    | 'shopping-bag'             // 📦 Compras
    | 'shopping-cart'            // Carrito
    | 'receipt-percent'          // Descuentos
    | 'scale'                    // Balanza/Peso
    | 'wallet'                   // Cartera

    // ============================================================================
    // 🎯 CATEGORÍA 11: ESPECIALES SISTEMA MIEL
    // ============================================================================
    | 'qr-code'                  // 📱 Código trazabilidad
    | 'tag'                      // 🏷️ Etiqueta/Tipo miel
    | 'bolt'                     // ⚡ Acciones rápidas
    | 'fire'                     // Importante
    | 'sparkles'                 // Destacado/Nuevo
    | 'light-bulb'               // 💡 Tips/Consejos
    | 'star'                     // ⭐ Favorito/Destacado
    | 'heart'                    // ❤️ Me gusta
    | 'hashtag'                  // 🔢 Número/Colmenas
    | 'truck'                    // 🚚 Transporte/En Tránsito

    // ============================================================================
    // 🔐 CATEGORÍA 12: SEGURIDAD
    // ============================================================================
    | 'lock-closed'              // 🔒 Bloqueado
    | 'lock-open'                // 🔓 Abierto
    | 'key'                      // 🔑 Clave/Acceso
    | 'finger-print'             // Autenticación
    | 'shield-exclamation';      // Seguridad

/**
 * Tamaños disponibles para los iconos
 * Basados en Tailwind sizing
 */
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Variantes de iconos disponibles
 * Por ahora solo outline, expandible a solid
 */
export type IconVariant = 'outline' | 'solid';

/**
 * Configuración completa de un icono
 */
export interface IconConfig {
    name: IconName;
    size: IconSize;
    variant: IconVariant;
    color?: string;
    className?: string;
    strokeWidth?: number;
}

/**
 * Props del componente de icono
 */
export interface IconProps {
    name: IconName;
    size?: IconSize;
    variant?: IconVariant;
    color?: string;
    className?: string;
    strokeWidth?: number;
}

// ============================================================================
// 🎨 CONFIGURACIÓN POR DEFECTO
// ============================================================================

/**
 * Mapeo de tamaños a clases de Tailwind
 */
export const ICON_SIZE_MAP: Record<IconSize, string> = {
    xs: 'w-3 h-3',      // 12px - Muy pequeño (badges)
    sm: 'w-4 h-4',      // 16px - Pequeño (texto inline)
    md: 'w-5 h-5',      // 20px - Medio (default, menús)
    lg: 'w-6 h-6',      // 24px - Grande (headers)
    xl: 'w-8 h-8',      // 32px - Extra grande (hero)
    '2xl': 'w-10 h-10'  // 40px - Jumbo (ilustraciones)
};

/**
 * Mapeo de stroke-width por tamaño
 * Iconos más pequeños necesitan stroke más grueso
 */
export const ICON_STROKE_WIDTH_MAP: Record<IconSize, number> = {
    xs: 2,        // Más grueso para legibilidad
    sm: 1.75,
    md: 1.5,      // Default estándar
    lg: 1.5,
    xl: 1.25,     // Más delgado para detalles
    '2xl': 1.25
};

/**
 * Configuración por defecto
 */
export const DEFAULT_ICON_CONFIG: IconConfig = {
    name: 'bee',           // Default: abeja (identidad Oaxaca Miel)
    size: 'md',
    variant: 'outline',
    strokeWidth: 1.5
};

// ============================================================================
// 🗺️ MAPEO EMOJI → ICONO
// ============================================================================

/**
 * Mapeo de emojis del sistema a nombres de iconos
 * Para facilitar la migración
 */
export const EMOJI_TO_ICON_MAP: Record<string, IconName> = {
    // Identidad
    '🍯': 'honey',
    '🐝': 'bee',
    '🏠': 'hive',
    '🌼': 'flower',

    // Roles
    '👑': 'crown',
    '🏢': 'building-office',
    '👤': 'user',
    '💤': 'user-circle',
    '👥': 'users',
    '🛡️': 'shield-check',

    // Navegación
    '📊': 'chart-bar',
    '📋': 'document-text',
    '⚙️': 'cog-6-tooth',

    // Ubicación
    '🗺️': 'map',
    '📍': 'map-pin',
    '🏞️': 'map-pin',

    // Acciones
    '➕': 'plus',
    '✏️': 'pencil',
    '🗑️': 'trash',
    '🔍': 'magnifying-glass',
    '🔗': 'link',
    '🔄': 'arrow-path',

    // Estados
    '✅': 'check-circle',
    '❌': 'x-circle',
    '⚠️': 'exclamation-triangle',
    'ℹ️': 'information-circle',
    '🕐': 'clock',
    '🔔': 'bell',
    '👁️': 'eye',
    '💡': 'light-bulb',

    // Comercio
    '📦': 'shopping-bag',
    '💰': 'currency-dollar',

    // Especiales
    '⚡': 'bolt',
    '🔢': 'hashtag',
    '🏷️': 'tag',
    '📱': 'qr-code',
    '⭐': 'star',
    '❤️': 'heart'
};

/**
 * Helper para obtener nombre de icono desde emoji
 */
export function getIconFromEmoji(emoji: string): IconName {
    return EMOJI_TO_ICON_MAP[emoji] || 'question-mark-circle';
}