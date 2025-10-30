import { Component, Input, OnInit } from '@angular/core';
import { AnimationOptions, LottieComponent } from 'ngx-lottie';

type AnimationType = 'bee-looking' | 'bee-lieve' | 'load-hive';

@Component({
    selector: 'app-bee-loader',
    standalone: true,
    imports: [LottieComponent],
    templateUrl: './bee-loader.component.html',
    styleUrl: './bee-loader.component.css'
})
export class BeeLoaderComponent implements OnInit {
    @Input() animation: AnimationType = 'load-hive';
    @Input() message: string = 'Cargando...';
    @Input() showMessage: boolean = true;
    @Input() fullscreen: boolean = true; // ✅ Controla si ocupa toda la pantalla o solo el contenedor

    // ✅ Declarar options como propiedad
    options!: AnimationOptions;

    // ✅ Inicializar en ngOnInit (una sola vez)
    ngOnInit(): void {
        this.options = {
            path: `animations/${this.animation}.json`,
            loop: true,
            autoplay: true
        };
    }
}