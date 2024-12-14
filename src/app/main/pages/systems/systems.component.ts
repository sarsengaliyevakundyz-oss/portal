import {Component, OnInit} from '@angular/core';
import {NgForOf} from '@angular/common';
import {RouterModule} from '@angular/router';
import {SystemsService} from '../../../shared/services/systems.service';
import {SystemModel} from '../../../shared/models/system.model';

@Component({
  selector: 'app-systems',
  standalone: true,
  imports: [
    NgForOf,
    RouterModule
  ],
  templateUrl: './systems.component.html',
  styleUrl: './systems.component.css'
})
export class SystemsComponent implements  OnInit{

  constructor(private service: SystemsService) {
  }
  items : SystemModel[]= [];
  //{ id: '1', title: 'Сбор данных', icon: 'systems/sbor.png' },

  ngOnInit(): void {
    this.getData();
  }

  getData(){
    this.service.getList().subscribe(res=>{
      this.items = res.result;
    })
  }

}
