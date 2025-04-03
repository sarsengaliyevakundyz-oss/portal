import {Component, EventEmitter, Output} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {NzModalComponent} from 'ng-zorro-antd/modal';
import {NzColDirective, NzRowDirective} from 'ng-zorro-antd/grid';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {NgForOf} from '@angular/common';
import {NzButtonComponent} from 'ng-zorro-antd/button';

@Component({
  selector: 'app-add-system',
  standalone: true,
  imports: [
    NzModalComponent,
    ReactiveFormsModule,
    NzRowDirective,
    NzColDirective,
    NzInputDirective,
    TranslatePipe,
    NgForOf,
    NzButtonComponent
  ],
  templateUrl: './add-system.component.html',
  styleUrl: './add-system.component.css'
})
export class AddSystemComponent {
  @Output() formSubmitted = new EventEmitter<any>(); // Emit data to parent component
  @Output() cancel= new EventEmitter();
  isCreateFormVisible = true;
  form: FormGroup;

  constructor(private fb: FormBuilder, private translate: TranslateService) {
    this.form = this.fb.group({
      code: ['', Validators.required],
      descriptionKz: ['', Validators.required],
      descriptionRu: ['', Validators.required],
      kurator: this.fb.array([]),
      nameKz: ['', Validators.required],
      nameRu: ['', Validators.required],
      pathImgKz: ['', Validators.required],
      pathImgRu: ['', Validators.required]
    });
  }

  get kuratorControls() {
    return this.form.get('kurator') as FormArray;
  }

  closeModal(): void {
    this.cancel.emit();
  }

  addKurator(): void {
    this.kuratorControls.push(
      this.fb.group({
        departamentKz: ['', Validators.required],
        departamentRu: ['', Validators.required],
        kuratorKz: ['', Validators.required],
        kuratorRu: ['', Validators.required]
      })
    );
  }

  submitForm(): void {
    if (this.form.invalid) {
      return;
    }

    const formData = {
      code: this.form.value.code,
      description: {
        kz: this.form.value.descriptionKz,
        ru: this.form.value.descriptionRu
      },
      kurator: this.form.value.kurator.map((k: any) => ({
        departament: { kz: k.departamentKz, ru: k.departamentRu },
        kurator: { kz: k.kuratorKz, ru: k.kuratorRu }
      })),
      name: {
        kz: this.form.value.nameKz,
        ru: this.form.value.nameRu
      },
      pathImg: {
        kz: this.form.value.pathImgKz,
        ru: this.form.value.pathImgRu
      }
    };

    this.formSubmitted.emit(formData); // Send data to parent component
    this.isCreateFormVisible = false; // Close modal
  }
}
