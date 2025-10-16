import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarService } from '../../../core/services/sidebar.service';
import { DashboardNavbarComponent } from '../dashboard-layout/dashboard-navbar/dashboard-navbar.component';
import { DashboardSidebarComponent } from '../dashboard-layout/dashboard-sidebar/dashboard-sidebar.component';
import { DashboardFooterComponent } from '../dashboard-layout/dashboard-footer/dashboard-footer.component';

@Component({
    selector: 'app-dashboard-layout',
    standalone: true,
    imports: [
        CommonModule,
        RouterOutlet,
        DashboardNavbarComponent,
        DashboardSidebarComponent,
        DashboardFooterComponent
    ],
    templateUrl: './dashboard-layout.component.html',
    styleUrl: './dashboard-layout.component.css'
})
export class DashboardLayoutComponent implements OnInit {
    private sidebarService = inject(SidebarService);

    // Exponer estado del sidebar al template
    sidebarOpen = this.sidebarService.isOpen;

    ngOnInit(): void {
        // Inicializar estado del sidebar según tamaño de pantalla
        this.sidebarService.initializeState();
    }

    /**
     * Toggle del sidebar (llamado desde navbar)
     */
    toggleSidebar(): void {
        this.sidebarService.toggle();
    }

    /**
     * Cerrar sidebar (al hacer click en backdrop mobile)
     */
    closeSidebar(): void {
        this.sidebarService.close();
    }
}