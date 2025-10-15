import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BeeLoaderComponent } from './shared/components/bee-loader/bee-loader.component';

@Component({
  selector: 'app-root',
  imports: [BeeLoaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'compras_frontend_aup';
}
