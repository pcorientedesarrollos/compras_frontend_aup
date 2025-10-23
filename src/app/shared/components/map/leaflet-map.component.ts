/**
 * ============================================================================
 * 🗺️ LEAFLET MAP COMPONENT - SISTEMA OAXACA MIEL
 * ============================================================================
 *
 * Componente reutilizable para mostrar mapas con Leaflet + OpenStreetMap
 *
 * INPUTS:
 * - latitude: Latitud GPS (requerido)
 * - longitude: Longitud GPS (requerido)
 * - markerTitle: Texto del marcador (opcional)
 * - zoom: Nivel de zoom inicial (default: 13)
 * - height: Altura del mapa (default: '400px')
 *
 * EJEMPLO DE USO:
 * ```html
 * <app-leaflet-map
 *   [latitude]="17.0732"
 *   [longitude]="-96.7266"
 *   [markerTitle]="'Oaxaca Centro'"
 *   [zoom]="15"
 *   [height]="'500px'">
 * </app-leaflet-map>
 * ```
 *
 * ============================================================================
 */

import {
    Component,
    input,
    effect,
    ElementRef,
    ViewChild,
    AfterViewInit,
    OnDestroy,
    PLATFORM_ID,
    inject
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as L from 'leaflet';

@Component({
    selector: 'app-leaflet-map',
    standalone: true,
    imports: [],
    templateUrl: './leaflet-map.component.html',
    styleUrl: './leaflet-map.component.css'
})
export class LeafletMapComponent implements AfterViewInit, OnDestroy {
    private platformId = inject(PLATFORM_ID);

    // ============================================================================
    // INPUTS
    // ============================================================================

    /** Latitud GPS */
    latitude = input.required<number>();

    /** Longitud GPS */
    longitude = input.required<number>();

    /** Título del marcador */
    markerTitle = input<string>('Ubicación');

    /** Nivel de zoom inicial */
    zoom = input<number>(13);

    /** Altura del contenedor del mapa */
    height = input<string>('400px');

    // ============================================================================
    // VIEWCHILD
    // ============================================================================

    @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef<HTMLDivElement>;

    // ============================================================================
    // PRIVATE PROPERTIES
    // ============================================================================

    private map: L.Map | null = null;
    private marker: L.Marker | null = null;

    // ============================================================================
    // LIFECYCLE HOOKS
    // ============================================================================

    ngAfterViewInit(): void {
        // Solo inicializar en el navegador (no en SSR)
        if (isPlatformBrowser(this.platformId)) {
            this.initMap();
        }
    }

    ngOnDestroy(): void {
        this.destroyMap();
    }

    // ============================================================================
    // CONSTRUCTOR
    // ============================================================================

    constructor() {
        // Reaccionar a cambios en las coordenadas
        effect(() => {
            if (this.map) {
                this.updateMapPosition();
            }
        });
    }

    // ============================================================================
    // MAP METHODS
    // ============================================================================

    /**
     * Inicializar el mapa de Leaflet
     */
    private initMap(): void {
        if (!this.mapContainer) {
            console.error('El contenedor del mapa no está disponible');
            return;
        }

        const lat = this.latitude();
        const lng = this.longitude();

        // Crear mapa
        this.map = L.map(this.mapContainer.nativeElement, {
            center: [lat, lng],
            zoom: this.zoom(),
            scrollWheelZoom: true,
            zoomControl: true
        });

        // Agregar capa de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);

        // Agregar marcador
        this.addMarker(lat, lng);

        // Forzar redimensionamiento después de renderizar
        setTimeout(() => {
            this.map?.invalidateSize();
        }, 100);
    }

    /**
     * Agregar o actualizar marcador
     */
    private addMarker(lat: number, lng: number): void {
        if (!this.map) return;

        // Remover marcador anterior si existe
        if (this.marker) {
            this.marker.remove();
        }

        // Crear nuevo marcador con icono personalizado
        const customIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        this.marker = L.marker([lat, lng], { icon: customIcon })
            .addTo(this.map)
            .bindPopup(`<b>${this.markerTitle()}</b><br>Lat: ${lat}<br>Lng: ${lng}`)
            .openPopup();
    }

    /**
     * Actualizar posición del mapa cuando cambian las coordenadas
     */
    private updateMapPosition(): void {
        if (!this.map) return;

        const lat = this.latitude();
        const lng = this.longitude();

        // Centrar mapa
        this.map.setView([lat, lng], this.zoom());

        // Actualizar marcador
        this.addMarker(lat, lng);
    }

    /**
     * Destruir mapa al desmontar componente
     */
    private destroyMap(): void {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        this.marker = null;
    }
}
