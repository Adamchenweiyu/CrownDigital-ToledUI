import { Component, ViewChild, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderQueue } from '../model/OrderQueue';


// D3 For Stats Module
import * as d3 from 'd3-selection';
import * as d3Scale from "d3-scale";
import * as d3Array from "d3-array";
import * as d3Axis from "d3-axis";
import * as d3Format from "d3-format";
import {Howl, Howler} from 'howler';
@Component({
  selector: 'app-newUI',
  templateUrl: 'newUI.page.html',
  styleUrls: ['newUI.page.scss']
})

export class NewUI implements OnInit{
  dev_mode = false;
  old_stats = true;

  ad_api_serve = "https://localhost:3001/file";
  //ad_api_serve = "https://192.168.10.11:3001/file";

  live_ad = true;


  order__in = true;
  butt__animation = false;
  jump__into__water = false;
  soaking__in__water = false;
  drink__filled = false;
  PH__complete = false;


  
  // CARTRIDGING
  envt = {
    'xyz':{
      ad_loop_front_playback: true,
      
      greet_voice : 2,
      main_voice : 2,
      flashy_logo: false,
      
      targetted_ad: false,
      targetted_ad_loop: false,
      targetted_ad_insert: true,
      ad_at_back_screen: false,

      tuck_bars: false,
      serving: '6_hole',
      bg_video_interval: 88000,
      trigger_product_video: false,
      queue_length: 10,
      got_telemetry: false,
      got_photo_taking: false
    },
    'retail':{
      ad_loop_front_playback: true,
      
      greet_voice : 2,
      main_voice : 2,
      flashy_logo: false,
      
      targetted_ad: false,
      targetted_ad_loop: true,
      targetted_ad_insert: true,
      ad_at_back_screen: false,

      tuck_bars: false,
      serving: '6_hole',
      bg_video_interval: 100000,
      trigger_product_video: false,
      queue_length: 10,
      got_telemetry: true,
      got_photo_taking: true
    }
  }
  
  // current screen shown on the cart UI, 
  screen_mode : string = "main";

  // if want logo to be always on
  still_mode : boolean = true;

  // Ad Rotation
  ad_rotation = 1;

  // Order Queues
  order_queue: OrderQueue[];
  order_queue_1: OrderQueue[];
  order_queue_2: OrderQueue[];
  order_queue_pend: OrderQueue[];
  order_queue_dispens: OrderQueue[];

  is_queue_loaded: boolean = false;

  order_poller : any;  // continuous poller for checking on order


  // Filtered Queues
  slots = [] ;
  eversys = [];
  
  // cache for last known slot entries for detecting new slot entries
  now_slots = [];
  
  // background video playing synchronize
  
  video_poller : any;
  video : any;

  rows_cache = "";

  now_ids = [];
  
  // boolean marker, checked constantly if any drink being processed on
  is_empty = true;
  
  skip_first_video_play = true;

  // markers for various ongoing mode-states
  ad_playing = false;
  stats_playing = false;
  game_playing = false;
  slides_playing = false;
  triggered_ad_playing = false;

  // flag to avoid actions done when system starting up
  first_load = true;

  position = 50;

  // active voices
  synth : any;
  voice : any; 

  // google voice numbers
  main_voice = 4;
  greet_voice = 4;

  // ad rotation
  ad_no : number = 0;

  // bean!
  bar_hidden = true;

  // hiding of top bar during cancels
  hide_bars = false; 
  tuck_bars = false; 

  // timer related counters
  
  trig_ad_timeout : any;
  ad_timeout : any;

  // telemetry related
  order_pending = false;
  cups = -1;
  milk_time = -1;
  coffee_time = -1; 
  maintenance_mode = "O";
  last_order_item_read = "";

  // dynamic advertising  
  targetted_ad = false;
  targetted_ad_loop = false;
  targetted_ad_insert = false;

  ad_trigged = false;
  ad_trigged_timeout : any;


  // return the global native browser window object
  _window() : any {
    return window;
  }

  //cartridge(variant for cart system)
  cartridge = "";
  is_main = true;

  title = "";

  // serving type, 2_hole (penang), 6_hole (retail future)
  serving = "2_hole";

  // veil new game
  new_game_hidden = true;
  
  slide = 1;
  
  queue_length = 10;

  ad_loop_front_playback = false;

  slide_backwards = false;
  dragging = false;
  drag_clear_timeout : any;

  photobooth_initialized = false;

  // for pigeonhole visual displacement on TOLED

  sl_displace=['3','20','37','54','71','88']
  //sl_displace=['54','37']

  got_photo_taking=false;
  got_telemetry=false;
  
  trigger_product_video=false;
  ad_at_back_screen=false;

  bg_video_interval : any;
  
  constructor(private api: ApiService, private router: Router, private activatedRoute: ActivatedRoute) { //, private photobooth: PhotoboothComponent) { 

    // if redir parameter then this PWA is redirect to a subroute
    var redir = this.activatedRoute.snapshot.queryParamMap.get('redir');
    var start_hidden = this.activatedRoute.snapshot.queryParamMap.get('start_hidden');

    if (start_hidden == 'true') {this.bar_hidden = true}

    if (redir){
      this.is_main = false; // this is background video or ELO
 
      this.router.navigateByUrl('/' + redir);

    } else {
      this.is_main = true; // is the main screen
      
      this.api.get_campaign_media('1').subscribe(
        r => {
          this.rotate_ads=r['rotate_ads'];
          this.insert_promo=r['insert_promo'];
          this.bg_video_interval=r['bg_interval'];
          this.trail_promo=r['trail_promo'];
          this.popup_promo=r['popup_promo'];
          this.demo_ads=r['demo_ads'];
          console.log(this.rotate_ads);
          console.log(this.demo_ads);
        }
      );
      setTimeout(()=>
      {
        this.synth = window.speechSynthesis;
        this.voice = (this.synth.getVoices())[this.main_voice];
        
        var say_this = new SpeechSynthesisUtterance("testing 1 2 3 ");
        say_this.volume = 0.01;
      
        say_this.voice = this.voice;
        this.synth.speak(say_this);
      }, 1400);
      setTimeout(()=>
      {
        this.synth = window.speechSynthesis;
        this.voice = (this.synth.getVoices())[this.main_voice];
        
        var say_this = new SpeechSynthesisUtterance("testing 1 2 3 ");
        say_this.volume = 0.02;
      
        say_this.voice = this.voice;
        this.synth.speak(say_this);
      }, 2800);
    }


    // load cartridge(variant for cart system)
    // defaults to "mvp" cartridge
    if (!localStorage.getItem("cartridge")){
      localStorage.setItem("cartridge", "xyz");
    }
    this.cartridge = localStorage.getItem("cartridge");
    
    this.title = this.envt[this.cartridge].title;
    this.main_voice = this.envt[this.cartridge].main_voice;
    this.greet_voice = this.envt[this.cartridge].greet_voice;

    this.queue_length = this.envt[this.cartridge].queue_length;

    // tucking of top bar
    this.tuck_bars = this.envt[this.cartridge].tuck_bars;
    this.targetted_ad = this.envt[this.cartridge].targetted_ad;
    this.targetted_ad_loop = this.envt[this.cartridge].targetted_ad_loop;
    this.targetted_ad_insert = this.envt[this.cartridge].targetted_ad_insert;
    this.trigger_product_video = this.envt[this.cartridge].trigger_product_video
    this.ad_loop_front_playback = this.envt[this.cartridge].ad_loop_front_playback;

    // serving variation, currenty 2 pigeon hole
    this.serving = this.envt[this.cartridge].serving;
    
    this.got_telemetry = this.envt[this.cartridge].got_telemetry;
    this.got_photo_taking = this.envt[this.cartridge].got_photo_taking;
    this.ad_at_back_screen = this.envt[this.cartridge].ad_at_back_screen;
    //this.bg_video_interval = this.envt[this.cartridge].bg_video_interval;
    console.log("bgi"+this.bg_video_interval);
    // reset video running flag at 
    localStorage.setItem('video_running','0');

    window['close_game'] = this.close_game.bind(this);
     
    this.slot_loop[0] = setInterval(()=>{this.slot_count[0] += 1; if (this.slot_count[0] == 15){this.slot_count[0] = 0;} }, 1000);
    this.slot_loop[1] = setInterval(()=>{this.slot_count[1] += 1; if (this.slot_count[1] == 15){this.slot_count[1] = 0;} }, 1000);
    this.slot_loop[2] = setInterval(()=>{this.slot_count[2] += 1; if (this.slot_count[2] == 15){this.slot_count[2] = 0;} }, 1000);
    this.slot_loop[3] = setInterval(()=>{this.slot_count[3] += 1; if (this.slot_count[3] == 15){this.slot_count[3] = 0;} }, 1000);
    this.slot_loop[4] = setInterval(()=>{this.slot_count[4] += 1; if (this.slot_count[4] == 15){this.slot_count[4] = 0;} }, 1000);
    this.slot_loop[5] = setInterval(()=>{this.slot_count[5] += 1; if (this.slot_count[5] == 15){this.slot_count[5] = 0;} }, 1000);
  }
  
  rotate_ads = [];
  insert_promo = [];
  trail_promo = [];
  popup_promo = [];
  demo_ads = [];
  

  slot_count = [0,0,0,0,0,0];
  
  ngOnInit() { 
    
  }
  ngAfterViewInit(){
  }

  bar_on(){
    this.front_bgm_play = false;
    this.cancel();
    
    this.halt_bg_video();
    this.suspend_triggering = true;
    this.reduced = false;

    this.bar_hidden = false;
  }
  bar_off(){
    this.front_bgm_play = false;
    this.cancel();

    this.bar_hidden = true;
  }
  

  devmode_on(){
    this.dev_mode = true;

    console.log('dev on');
  }
  devmode_off(){
    this.dev_mode = false;
    console.log('dev off');
  }

  restart(){

    // DISABLED
  }

  cartridge_change(next_cartridge : string){
    localStorage.setItem("cartridge", next_cartridge);
    localStorage.setItem("reload_bg", next_cartridge);
    
    document.location.reload();
  }

  toggle_slide(){
    clearTimeout(this.drag_clear_timeout);
    this.slide_backwards = false;
    this.slide = this.slide + 1;
    if (this.slide == 33) this.slide=1;
    this.drag_clear_timeout = setTimeout(()=>{this.dragging=false},2000);
  }
  toggle_slide_forth(){
    clearTimeout(this.drag_clear_timeout);
    this.dragging = true;
    this.slide_backwards = false;
    this.slide = this.slide + 1;
    if (this.slide == 33) this.slide=1;
    this.drag_clear_timeout = setTimeout(()=>{this.dragging=false},2000);
  }
  toggle_slide_back(){
    clearTimeout(this.drag_clear_timeout);
    this.dragging = true;
    this.slide_backwards = true;
    this.slide = this.slide - 1;
    if (this.slide == 0) this.slide = 32;
    this.drag_clear_timeout = setTimeout(()=>{this.dragging=false},2000);
  }

  adfile="";
  
  launch_loop_ad(adfile, length, at_front, resume_at){
    if (!at_front){
      this.api.set_back_ad_to_play(adfile, length, resume_at).subscribe(
        r => {
          this.screen_mode = "new_ad_stat_only";
          console.log("ad backgrd play");
        }
      );
      setTimeout(()=>{
        this.api.set_back_ad_to_stop().subscribe(
          r => {
            console.log("ad backgrd to stop multiple triggering");
          }
        );
      },2000)
    } else {
      this.adfile = adfile;
      this.adlength = length;

      this.halt_bg_video();
      this.suspend_triggering = true;
      this.reduced = false;
      
      if (this.ad_playing) 
      {
        console.log('blocked (alr playing) ' + this.ad_playing);
        return;
      }
  
      this.ad_no = 0;
      this.screen_mode = "new_ad";
      this.ad_playing = true;
      
      this.front_play_elapsed = 0;
      clearInterval(this.elapse_counter);
      this.elapse_counter = setInterval(()=>{this.front_play_elapsed += 500; console.log('launch_loop:' + this.front_play_elapsed)}, 500);
  
      setTimeout(
        ()=>{         
          var ad: any = document.getElementById("advert_0");   
          ad.play();
        }, 300
      )
    }
    this.trig_ad_timeout = setTimeout(()=> {
      console.log('triggered ad timeout');
      this.ad_playing = false;

      this.suspend_triggering = false;
      
      this.screen_mode = "main";
    }, length);
  }

  adlength = 10000;

  launch_new_ad(adfile, length){
    if (this.ad_at_back_screen && this.order_pending){
      this.adfile = adfile;
      this.adlength = length;
      this.api.set_back_ad_to_play(adfile, length, 0).subscribe(
        r => {
          this.screen_mode = "new_ad_stat_only";
          console.log("ad backgrd play");
        }
      );
      setTimeout(()=>{
        this.api.set_back_ad_to_stop().subscribe(
          r => {
            console.log("ad backgrd to stop multiple triggering");
          }
        );
      },2000)
    } else {
      this.adfile = adfile;
      this.adlength = length;
      this.halt_bg_video();
      this.suspend_triggering = true;
      this.reduced = false;
      
      if (this.ad_playing) 
      {
        console.log('blocked (alr playing) ' + this.ad_playing);
        return;
      }
  
      this.ad_no = 0;
      this.screen_mode = "new_ad";
      this.ad_playing = true;
      
      this.front_play_elapsed = 0;
      clearInterval(this.elapse_counter);
      this.elapse_counter = setInterval(()=>{this.front_play_elapsed += 500; console.log('new_ad'+this.front_play_elapsed)}, 500);
  
      setTimeout(
        ()=>{         
          var ad: any = document.getElementById("advert_0");   
          ad.play();
        }, 300
      )
    }
    
    
    this.trig_ad_timeout = setTimeout(()=> {
      console.log('triggered ad timeout');
      this.ad_playing = false;

      this.suspend_triggering = false;
      
      this.screen_mode = "main";

    }, length);
  }

  show_ad_selector = false;

  toggle_ad_selector(){
    this.show_ad_selector = !this.show_ad_selector;
  }
  served_ad_name="";
  served_ad = false;
  served_ad_length = 0;

  launch_served_ad(ad_name, ad_length){
    this.served_ad_name = ad_name;
    this.served_ad_length = ad_length;
    this.served_ad = true;
    this.show_ad_selector = false;
    if (this.ad_playing) 
    {
      console.log('blocked (alr playing) ' + this.ad_playing);
      return;
    }
    this.ad_no = 99;

    clearTimeout(this.trig_ad_timeout);

    this.halt_bg_video();
    this.suspend_triggering = true;
    this.reduced = false;
    this.screen_mode = "ad";
    this.ad_playing = true;

    setTimeout(
      ()=>{            
        
        var ad: any = document.getElementById("served_ad");
        ad.volume = (this.muted) ? 0 : 1;
        ad.play();
      }, 300
    )

    this.ad_timeout = setTimeout(()=> {
      console.log('served ad timeout');
      this.ad_playing = false;

      this.bg_videopoller_restart();

      this.screen_mode = "main";
    }, this.served_ad_length);
  }
  
  launch_ad(ad_no, variant){
    this.show_ad_selector = false;
    if (this.ad_playing) 
    {
      console.log('blocked (alr playing) ' + this.ad_playing);
      return;
    }
    this.ad_no= ad_no;

    clearTimeout(this.trig_ad_timeout);

    this.halt_bg_video();
    this.suspend_triggering = true;
    this.reduced = false;

    if ((ad_no == 8)||(ad_no == 9)){
      this.reduced = true;
    } 

    this.screen_mode = "ad";
    this.ad_playing = true;
    
    setTimeout(
      ()=>{            
        var ad: any = document.getElementById("advert_"+ this.ad_no);
        
        console.log('ad play ' + this.ad_no);

        this.front_play_elapsed = 0;
        clearInterval(this.elapse_counter);
        this.elapse_counter = setInterval(()=>
          {
            this.front_play_elapsed += 500;
            //console.log('regular ad:'+this.front_play_elapsed)
          }, 500
        );

        ad.volume = (this.muted) ? 0 : 1;
        ad.play();
      }, 300
    )
    
    var ad_length;
    if (this.ad_no == 9) ad_length = this.popup_promo[0].length;
    if (this.ad_no == 8) ad_length = 8000;
    if (this.ad_no == 7) ad_length = this.rotate_ads[this.ad_rotation - 1].length;
    if (this.ad_no == 10) ad_length = this.insert_promo[0].length;

    console.log("ad played" + this.rotate_ads[this.ad_rotation - 1].name);
    console.log("adlength played" + ad_length);

    this.ad_timeout = setTimeout(()=> {
      console.log('reg ad timeout');
      this.ad_playing = false;
      
      if (this.ad_no == 8) this.bg_videopoller_restart();
      
      this.screen_mode = "main";
    }, ad_length);
  }
  
  close_game(){
    this.cancel();
  }

  cancel(){
    clearInterval(this.elapse_counter);
    
    this.show_ad_selector = false;
    
    this.new_game_hidden = true;

    this.reduce_first = true;
    this.reduced = false;

    this.game_playing = false;
    this.ad_playing = false;
    this.stats_playing = false;
    this.slides_playing = false;
    clearTimeout(this.ad_timeout);

    if (!this.bar_hidden) this.bg_videopoller_restart();
    
    this.screen_mode = "main";
    
    if (this.targetted_ad){
      this.suspend_triggering = false;
    }
  }

  ad_interrupt_main = false;


  launch_new_game(){
    this.show_ad_selector = false;
    this.halt_bg_video();
    this.suspend_triggering = true;
    this.reduced = false;
    this.new_game_hidden = false;
    this.game_playing = true;

    window['start_unity']();
    
    console.log('new game run');
  }

  launch_stats(){
    this.show_ad_selector = false;
    this.halt_bg_video();
    this.suspend_triggering = true;
    this.reduced = false;
    
    setTimeout(()=> {
      this.initSvg();
      this.gen_chart();
    }, 500)

    this.stats_playing = true;
    this.screen_mode = "stats";
  }

  dismiss_slides(){
    setTimeout(()=>{this.cancel()}, 500);
  }
  dismiss_slides_anim(){
    document.querySelector(".slide").classList.add("animated", "bounceOutUp", "slow");
    setTimeout(()=>{this.cancel()}, 3000);
  }
  launch_slides(){
    this.show_ad_selector = false;
    this.slide = 1;
    this.halt_bg_video();
    this.suspend_triggering = true;
    this.reduced = false;

    this.slides_playing = true;
    this.screen_mode = "slides";
  }         
  
  halt_bg_video(){
    //clearTimeout(this.ad_timeout);
    localStorage.setItem('halt_video', '1');  
    setTimeout(
      ()=>{
        localStorage.setItem('halt_video', '0');  
      }, 1500
    )
    if (this.targetted_ad){
      this.api.suspend_back_ad().subscribe(
        r => {
        }
      );
    }
  }
  suspend_triggering = false;

  maleCount = 50;
  femaleCount = 50;
  ageGroup = 2;
  gender = "";

  // upon cancel, restart the background video poller
  targetting_idle = false;
  
  dynad_file_serve = true;

  loop_ad_timer : any;

  play_at_front(){
    this.triggered_ad_playing = true;

    this.launch_loop_ad("3F", 17 * 1000, true, 0 );
    this.loop_ad_timer = setTimeout(()=>{
      this.triggered_ad_playing = false;
      }, (17 * 1000) + 680
    );
  }
  play_at_back(){
    this.triggered_ad_playing = true;

    this.launch_loop_ad("2M", 15 * 1000, false, 0 );
    this.loop_ad_timer = setTimeout(()=>{
      this.triggered_ad_playing = false;
      }, (15* 1000) + 680
    );
  }
  resume_play_at_back(resume_from){
    this.triggered_ad_playing = true;

    this.launch_loop_ad(this.adfile, this.adlength, false, resume_from);
    // this.loop_ad_timer = setTimeout(()=>{
    //   this.triggered_ad_playing = false;
    //   }, (15* 1000) + 680
    // );
  }

  play_looping_ad(){
    if (this.targetted_ad_insert && this.triggered_ad_playing){
      console.log('also skipped triggered ad; if alr playing') ; 
      return;
    }
    if (this.ad_loop_front_playback){
      this.play_at_front();
      this.ad_loop_front_playback = false;
    } else {
      this.play_at_back();
      this.ad_loop_front_playback = true;
    }

  }
  play_triggered_ad(){
    if (this.targetted_ad_insert && this.triggered_ad_playing){
      console.log('skipped triggered ad because alr playing') ; 
      return;
    }
    
    this.api.dynad_sensing().subscribe(
      r => {
        if (r['ageGroup'] != null){
          this.ageGroup = parseInt( r['ageGroup'] );
        } else {
          this.ageGroup = 0;
        }

        this.gender = r['gender'];

        if ((!this.dynad) && this.dev_mode) {
          console.log('show dyn ad values only in dev mode');
          this.ad_trigged = true; 
          return;
        }
        
        if ((!this.dynad) || (r['gender'] == null)) {
          console.log('no triggering to take place, enter ad loop' + r['gender'] ) ; 
          this.targetting_idle = true;
          return;
        };
        
        this.triggered_ad_playing = true;

        this.ad_trigged_timeout = setTimeout(()=>{this.ad_trigged = false;}, 8000);
        this.ad_trigged = true; 

        this.maleCount=parseInt( r['maleCount'] );
        this.femaleCount=parseInt( r['femaleCount'] );

        this.api.fetch_trig_ad(this.ageGroup, this.gender).subscribe(
          r => {
            console.log(r['adfile']+' => '+r['length']);

            this.launch_new_ad(r['adfile'], parseInt(r['length']) * 1000 );
            setTimeout(()=>{
              this.triggered_ad_playing = false;
              }, (parseInt(r['length']) * 1000) + 1680
            );
            
            this.api.create(this.gender).subscribe(
              r => {
                
              }
            );
          }
        );
      }
    );  
  }
  play_bg_video_front = true;
  front_bgm_play = false;

  play_bg_video(){
    if (this.skip_first_video_play) {
      console.log('first video skipped'); 
      this.skip_first_video_play = false; 
      return false;
    }
    
    if (!this.bar_hidden){
      console.log('demo ongoing; video should be bypassed'); 
      return false;
    }
    if (this.game_playing) {
      console.log('game playing; video should be bypassed'); 
      return false;
    }
    if (this.ad_playing) {
      console.log('ad playing; video should be bypassed'); 
      return false;
    }
    if (this.stats_playing) {
      console.log('stats playing; video should be bypassed'); 
      return false;
    }
    if (this.slides_playing) {
      console.log('slides playing; video should be bypassed'); 
      return false;
    }

    this.front_bgm_play = false;
    
    if (this.play_bg_video_front){
      setTimeout(
        () => {
          this.ad_rotation = this.ad_rotation + 1;
          if (this.ad_rotation >= (this.rotate_ads.length + 1)) this.ad_rotation = 1;
          
          console.log(this.rotate_ads[this.ad_rotation - 1]);
          
          setTimeout(
            ()=>{
              this.front_bgm_play = true;
              this.show_menu = true;
              setTimeout(()=>
                {
                  this.show_menu = false;
                  this.front_bgm_play = true;
                }, 20000);
            },
            this.rotate_ads[this.ad_rotation - 1].length
          );
          if (this.play_bg_video_front && (this.insert_promo.length > 0) ){
            setTimeout(
              ()=>{
                if (this.play_bg_video_front){
                  this.front_bgm_play = true;
                  this.launch_ad(10, '');
                  this.soften_background_volume();
                }
              },
              this.rotate_ads[this.ad_rotation - 1].length + this.insert_promo[0].delay
            );
          }

          this.launch_ad(7, '');
          this.soften_background_volume();
        }, 500
      );
    } else
    {
      this.front_bgm_play = false;
      setTimeout(()=>
        {
          this.front_bgm_play = false;
          // this.show_menu = false;
          // this.front_bgm_play = true;
        }, this.rotate_ads[this.ad_rotation - 1].length + 20000);

      setTimeout(
        ()=>{
          this.front_bgm_play = false;
          //this.show_menu = true;
          //this.front_bgm_play = true;
        },
        this.rotate_ads[this.ad_rotation - 1].length );

      console.log('attempt to play video'); 
      localStorage.setItem('video_running', '1');
      
      setTimeout(()=>{
        localStorage.setItem('video_running', '0');
      }, 2000);// 2sec(nominal number)
    }  
  }


  refresh_bars(){
    // hide top bars for 3s and reanimate them sliding back in
    this.hide_bars = true;
    setTimeout(()=>{
        this.hide_bars = false;
      },3000
    );
  }
  
  ionViewDidEnter(){  
    // execute below only if it is main screen, not ELO or background video panes
    if (!this.is_main) return;
    
    var StationClock = window['stn_clock']
    var clock = new StationClock("clock");
    window['clock']= clock;
    clock.body = StationClock.RoundBody;
    clock.dial = StationClock.GermanStrokeDial;
    clock.hourHand = StationClock.PointedHourHand;
    clock.minuteHand = StationClock.PointedMinuteHand;
    clock.secondHand = StationClock.HoleShapedSecondHand;
    clock.boss = StationClock.NoBoss;
    clock.minuteHandBehavoir = StationClock.BouncingMinuteHand;
    clock.secondHandBehavoir = StationClock.OverhastySecondHand;
  
    window.setInterval(function() { clock.draw() }, 50);

    this.bg_video_jolt();
    
    this.order_poller = setInterval(() => { this.load_order_queue();}, 1000);
  }
  ionViewDidLeave() {
    clearInterval(this.order_poller);
    clearInterval(this.video_poller);
  }


  reset_video_poller(){
    clearInterval(this.video_poller);
    this.video_poller = setInterval(() => {   
      console.log('suspend triggering: ' + this.suspend_triggering);
      //this.suspend_triggering=false;//interim
      if (this.targetted_ad && !this.game_playing && !this.slides_playing && !this.stats_playing && !this.suspend_triggering){
        console.log('test for idle'+this.targetting_idle);
        if (this.targetting_idle){
          if (this.targetted_ad_loop){
            this.play_looping_ad();
            this.targetting_idle = false;
          }
        } else {
          if (this.targetted_ad_insert){
            console.log("targ ad insert");
            this.play_triggered_ad();
          }
        }
      } else {
        if (!this.targetted_ad){
          this.play_bg_video();
        } else {
          console.log('nothing to do');
          return;
        }
      }
    }, 
      ( (!this.targetted_ad) ?
        (this.bg_video_interval) :
        (2000)
      )
    );
  }
  
  bg_videopoller_restart(){
    localStorage.setItem('video_running', '0');  
    this.play_bg_video();

    console.log('bg_video_restarted');

    this.reset_video_poller();
  }

  bg_video_jolt(){
    localStorage.setItem('video_running', '0');  
    this.play_bg_video();

    console.log('bg_video_jolted');

    this.reset_video_poller();
  }

  ella_demo(reel){
    this.devmode_off();
    
    if (reel == 'wave_and_speak'){
      setTimeout(()=>{
        this.synth = window.speechSynthesis;
        this.voice = (this.synth.getVoices())[this.main_voice];
        console.log(this.voice);
  
        var say_this = new SpeechSynthesisUtterance("Hi, your coffee is ready for drinking, bottoms ups");
        say_this.volume = 1;
        say_this.rate = 0.8;
        say_this.voice = this.voice;
        this.synth.speak(say_this);
      }, 4000);
      
      this.api.ella_demo("A1").subscribe(
        r => {
          
        }
      );
    }
  }
  
  // hide toolbar completely
  hide_all = false;

  photocountdown = 5;

  // photobooth related
  show_booth = false;
  photoblock = false;
  booth_ff = false;//to be used in freeze frame


  // newui queues
  pend_q = false;
  slots_q = false;

  // blocker for qr
  qrintro_playing = false; 

  take_picture(ord_num, cback){
    // this.photobooth.trigger_init();

    // this.photobooth.trigger_photobooth(ord_num ,function(){
    //   cback();
    // })
  }
  cancel_picture(){
    //this.photobooth.cancel_photobooth();
  }


  // PORTAL related
  show_portal= false;
  portalfade : any;
  portalappear : any;


  // telemetry indiactors  
  avail_1 = '';
  avail_2 = '';
  avail_3 = '';
  avail_4 = '';
  downr_1 = '';
  downr_2 = '';
  downr_3 = '';
  downr_4 = '';
  bean_status = ['','','',''];

  slot_loop = [null, null, null, null, null, null];

  // read order queue from CouchDB
  load_order_queue() {
    // for test VOICE
    if (true){
      this.poll_api();
    }
    
    if (this.got_photo_taking){
      this.api.got_photo_taking()
      .subscribe(
        r => {
          //console.log(r['next']);
          if (r['next'] && !this.photoblock){
            this.photoblock = true;
            this.photocountdown = 100;          
            this.show_booth = true;
            
            var pcd = setInterval(()=>{    
              if (this.photocountdown > 0 ) {this.photocountdown -= 1;}
              //console.log('cdown '+ this.photocountdown);
              this.cancel_picture();
            }, 1000);
  
            setTimeout(()=>{    
              this.take_picture(r['next'], ()=>
              {
                this.photoblock = false;
                this.api.end_photo_taking()
                .subscribe(
                  r => {
                  }
                );          
                setTimeout(()=>{this.show_booth = false;}, 3000);
                
                clearInterval(pcd);
              });
            }, 300);
          }
        }
      );
    }
    

    if (this.got_telemetry){
      this.api.get_telemetry()
        .subscribe(
          r => {
            this.maintenance_mode = r['maintenance_mode'];
            this.last_order_item_read = r['last_order_item_read'];
            this.cups = r['cups'];
            this.milk_time = r['milk_time'];
            this.coffee_time = r['coffee_time'];    
            this.avail_1 = r['a1'];
            this.avail_2 = r['a2'];
            this.avail_3 = r['a3'];
            this.avail_4 = r['a4'];
            this.bean_status = [(r['a1'] == "A") ? 'bean-up' : 'bean-down', 
              (r['a2'] == "A") ? 'bean-up' : 'bean-down', 
              (r['a3'] == "A") ? 'bean-up' : 'bean-down', 
              (r['a4'] == "A") ? 'bean-up' : 'bean-down'];
            this.downr_1 = r['dr1'];
            this.downr_2 = r['dr2'];
            this.downr_3 = r['dr3'];
            this.downr_4 = r['dr4'];
          }
      );
    }



    this.api.get_order_queue()
      .subscribe(
        r => {
          var rows_now_cache = JSON.stringify(r.rows);  // Stringify and cache result to serve as a comparator for order staleness
          if (rows_now_cache != this.rows_cache){       // if current queue != cached result, then make a fresh fetch
            var order_queue_pre = r.rows.map( o =><OrderQueue>{
                is_new: !(this.now_ids.indexOf(o["id"]) > -1),
                order_item_id: o["id"],
                product_id: o["product_id"],
                product_index: o["product_index"],
                product_name: o["product_name"],
                cust_name: o["cust_name"],
                cup_type: o["cup_type"],
                call_id: o["common_order_item_id"],
                subitem: o["common_order_item_id"] ,
                qr_status: o["qr_status"],
                status: o["status"],
                location: o["location"],
                created_by: o["created_by"],
                order_time: o["order_time"],
                load_time: o["load_time"],
                serve_time: o["serve_time"],
                collect_time: o["collect_time"],
                iced_text: o["iced_text"],
                modif_text: o["modif_text"],
                delapsed: false
              } 
            );
            console.log(order_queue_pre)

            var flashed_portal=false;
            // NEW ORDER DETECTED! 
            //speak voice + soften background audio + trigger product video(as necessary)
            if (!this.first_load){
              order_queue_pre.filter((x)=>{return x['is_new']}).forEach(
                (o)=>{
                  o['delapsed']=false;console.log(o['delapsed'])
                  if (!flashed_portal && (this.cartridge == 'xyz')){
                    flashed_portal = true;
                    this.portalfade= setTimeout(
                      ()=>{
                        this.show_portal = false;
                      }, 8000);
                    this.portalappear= setTimeout(
                      ()=>{
                        o['delapsed']=true;console.log(o['delapsed'])
                      }, 7000);
                    setTimeout(
                      ()=>{
                        this.show_portal = true;
                      }, 5000);
                  }
                  if (document.getElementById("ad_panel") != null){
                    document.getElementById("ad_panel").classList.add('fadeOut');   
                  }         
                  setTimeout(()=>{
                    if (document.getElementById("ad_panel") != null){
                      document.getElementById("ad_panel").classList.remove('fadeOut');
                    }
                    this.cancel();
                  }, 1500)
                  
                  this.synth = window.speechSynthesis;
                  this.voice = (this.synth.getVoices())[this.main_voice];
                  console.log(this.voice);
                  
                  var order_spoken;
                  if (o['call_id']){
                    order_spoken = (parseInt(o['call_id'].substring(0)) >= 100) ? (o['call_id'].split('').join(' ')) : o['call_id'];                    
                  } else {
                    var split_char = (this.main_voice == 12) ? ' ' : ' ';

                    order_spoken = (parseInt(o.order_item_id) >= 100) ? (o.order_item_id.split('').join(split_char)) : o.order_item_id;
                  }
                  console.log(order_spoken);

                  this.soften_background_volume();

                  // var drink_spoken = {
                  //   'Latte' : "lah tey",
                  //   'Teh Tarik' : "tay tahrake"
                  // };

                  if (this.trigger_product_video){
                    console.log("attempt prod vid"+o.product_id);
                    if (this.cartridge =='sffx'){
                      setTimeout(
                        () => {
                          this.launch_ad(8, '');
                        }, 4500
                      );
                    } else {
                      localStorage.setItem('run_prod_video', o.product_id);
                      setTimeout(
                        () => {
                          localStorage.setItem('run_prod_video', '0');
                        }, 3500
                      );  
                    }
                  }

                  // this.synth = window.speechSynthesis;
                  // this.voice = (this.synth.getVoices())[this.main_voice];
                  // console.log(this.voice);

                  // if (this.main_voice == 4){
                  //   var say_this = new SpeechSynthesisUtterance(((o['cust_name']) ? ("Hi " + o['cust_name']) : "" ) + " , Your " + 
                  //   (drink_spoken[o.product_name] ? drink_spoken[o.product_name] : o.product_name)
                  //   + ((o['cust_name']=='') ? ("") : "") + " is on the way");
                  //   say_this.volume = 1;
                  //   say_this.rate = 0.8;
                  // } else {
                  //   var say_this = new SpeechSynthesisUtterance("あなたの" + (o.product_name)
                  //   + "注文番号"+ order_spoken + "は準備中です");
                  //   say_this.rate = 0.95;
                  //   say_this.volume = 0.5;
                  // }
                  // say_this.voice = this.voice;
                  // this.synth.speak(say_this);
                }
              ) 
            } else {
              order_queue_pre.forEach(
                (o)=>{o['delapsed'] = true});
              console.log(order_queue_pre);
            }
            
            
            

            this.rows_cache = rows_now_cache;
            this.now_ids = r.rows.map((o) => {return o["id"];});

            this.order_pending = order_queue_pre.length > 0;

            this.order_queue = order_queue_pre.sort((a,b) => {return (parseInt(a.order_item_id)> parseInt(b.order_item_id) ? 1 : -1)} ) ;
            
            // TODO: support more than 2 queues, currently use 2 variables to capture left and right
            var order_queue_1_pre= this.order_queue.filter((o)=> {return ((o.status == "JUNKING") || (o.status == "QUEUED") || (o.status == "PROCESSING") || (o.status == "LOADING") || (o.status == "DISPENSING") || (o.status == "FILLED") || (o.status == "COMPLETED") ) && ((o.created_by == "CartElo1") || (o.created_by == "MOS")  ) } );
            this.order_queue_1 = order_queue_1_pre.slice(0,5).reverse();

            var order_queue_2_pre= this.order_queue.filter((o)=> {return ((o.status == "JUNKING") || (o.status == "QUEUED") || (o.status == "PROCESSING") || (o.status == "LOADING") || (o.status == "DISPENSING") || (o.status == "FILLED") || (o.status == "COMPLETED") ) && (o.created_by == "CartElo2") } );
            this.order_queue_2 = order_queue_2_pre.slice(0,5).reverse();

            var order_queue_pend_pre= this.order_queue.filter((o)=> {return (o.status == "QUEUED") || (o.status == "PROCESSING") || (o.status == "LOADING") || (o.status == "DISPENSING") || (o.status == "FILLED") } );
            this.order_queue_pend = order_queue_pend_pre.slice(0,8).reverse();
            this.pend_q = this.order_queue_pend.length > 0; 

            var order_queue_dispens_pre= this.order_queue.filter((o)=> {return (o.status == "DISPENSING") || (o.status == "FILLED")
            } );
            this.order_queue_dispens = order_queue_dispens_pre.slice(0,8).reverse();

            var slots_pre= this.order_queue.filter((o)=> {return ((o.status == "UNTAKEN") || (o.status == "COLLECTING")) } );
            var eversys_pre= this.order_queue.filter((o)=> {return ((o.status == "LOADING") || (o.status == "DISPENSING") || (o.status == "FILLED")) } );

            this.slots_q = slots_pre.length > 0; 

            this.eversys = [
              eversys_pre.find( (o) => o.location == "E1") || {order_item_id:'', product_id: '', call_id:'', subitem:'', product_name:""}, 
              eversys_pre.find( (o) => o.location == "E2") || {order_item_id:'', product_id: '', call_id:'', subitem:'', product_name:""}, 
              eversys_pre.find( (o) => o.location == "E3") || {order_item_id:'', product_id: '', call_id:'', subitem:'', product_name:""}, 
              eversys_pre.find( (o) => o.location == "E4") || {order_item_id:'', product_id: '', call_id:'', subitem:'', product_name:""}];

            var slots_p = [
              slots_pre.find( (o) => o.location == "S1") || {order_item_id:'', product_id: '', call_id:'', subitem:'', product_name:""}, 
              slots_pre.find( (o) => o.location == "S2") || {order_item_id:'', product_id: '', call_id:'', subitem:'', product_name:""}, 
              slots_pre.find( (o) => o.location == "S3") || {order_item_id:'', product_id: '', call_id:'', subitem:'', product_name:""}, 
              slots_pre.find( (o) => o.location == "S4") || {order_item_id:'', product_id: '', call_id:'', subitem:'', product_name:""}, 
              slots_pre.find( (o) => o.location == "S5") || {order_item_id:'', product_id: '', call_id:'', subitem:'', product_name:""}, 
              slots_pre.find( (o) => o.location == "S6") || {order_item_id:'', product_id: '', call_id:'', subitem:'', product_name:""}];

            this.is_empty = (this.order_queue.length == 0);
            
            this.play_bg_video_front = this.is_empty;

            this.slots = slots_p.map(
              (o, i)=> {
                var fromTime = new Date(o['order_time']);
                var toTime = new Date(o['serve_time']);

                var differenceTravel = toTime.getTime() - fromTime.getTime();
                var seconds = Math.floor((differenceTravel) / (1000));

                o['order_to_serve_time'] = seconds;

                var is_new = !(this.now_slots.indexOf(o.order_item_id) > -1);
                if (is_new && !this.first_load){
                  var offset_time = 0;

                  o['suspend'] = false;
                  
                  this.slot_count[i] = 2;
                  this.front_bgm_play = false;

                  if (!this.qrintro_playing){
                    setTimeout(
                      () => {
                        if (this.popup_promo.length > 0){
                          this.qrintro_playing = true;
                          this.ad_interrupt_main = true;
                          this.launch_ad(9, '');
                        }
                      }, 1500
                    );
                    setTimeout(
                      () => {
                        this.qrintro_playing = false;
                        this.ad_interrupt_main = false;
                      }, 9500
                    );
                  }

                  setTimeout(()=>{
                    o['suspend'] = false;
                    o['is_new'] = true;

                    var order_spoken;

                    if (o['call_id']){
                      order_spoken = (parseInt(o['call_id'].substring(0)) >= 100) ? (o['call_id'].split('').join(' ')) : o['call_id'];                    
                    } else {
                      var split_char = (this.main_voice == 12) ? ' ' : ' ';
                      order_spoken = (parseInt(o.order_item_id) >= 100) ? (o.order_item_id.split('').join(split_char)) : o.order_item_id;
                    }
                    //console.log(order_spoken);
                    
                    this.soften_background_volume();
                    var sound = new Howl({
                      src: ['assets/collect_drink.mp3'],
                      html5: true
                    });
                    
                    sound.play();

                    // var drink_spoken = {
                    //   'Latte' : "lah tey",
                    //   'Teh Tarik' : "tay tahrake"
                    // }
    
                    // this.synth = window.speechSynthesis;
                    // this.voice = (this.synth.getVoices())[this.main_voice];
                    // console.log(this.voice);

                    // if (this.main_voice == 2){
                    //   var say_this = new SpeechSynthesisUtterance(  (o['cust_name'] ? ("Hi " + o['cust_name']+", your drink") : ("Your order ")) + " is ready, please enjoy your "+ 
                    //     (drink_spoken[o.product_name] ? drink_spoken[o.product_name] : o.product_name)
                    //   );
                    //   say_this.volume = 1.0;
                    //   say_this.rate = 0.8;
                    // } else {
                    //   var say_this = new SpeechSynthesisUtterance("あなたの飲み物 "+ order_spoken + "が出来上がりました");
                    //   say_this.rate = 0.95;
                    //   say_this.volume = 0.5;
                    // }
                    // say_this.voice = this.voice;
                    // this.synth.speak(say_this);
                   
                    }, offset_time            
                  );
                } else {
                  o['is_new'] = false;
                }
                return o;
              }
            );

            this.now_slots = slots_p.map((o) => {return o.order_item_id;});
            this.is_queue_loaded = true;

            this.first_load = false;              
          }
        }
      )
  }

  clock_up = false;
  muted = false;
  dynad = false;

  show_menu = false;

  toggle_clock(){
    this.clock_up = !this.clock_up; 
  }
  // soften background volume, e.g. when order come in,
  soften_background_volume(){
    localStorage.setItem('softer', '1');  
    setTimeout(
      ()=>{
        localStorage.setItem('softer', '0');  
      }, 1500
    )
  }
  toggle_volume(){
    this.muted = !this.muted;
    if (this.muted){
      localStorage.setItem('set_volume', '0'); 
      (<HTMLAudioElement>document.querySelector('#advert_' + this.ad_no)).volume=0;
      console.log('muted');
    } else {
      localStorage.setItem('set_volume', '10'); 
      (<HTMLAudioElement>document.querySelector('#advert_' + this.ad_no)).volume=1;
      console.log('unmuted');
    }
  }
  toggle_dynad(){
    this.dynad = !this.dynad;
  }


  toTitleCase(str) {
    return str.replace(
      /\w\S*/g,
      function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      }
    );
  }


  poll_api() {
    //console.log("polling api");
    this.api.poll_api().subscribe(
      r => {
        if(r['ok']) {
          this.synth = window.speechSynthesis;
          this.voice = (this.synth.getVoices())[this.main_voice];
          
          var say_this = new SpeechSynthesisUtterance(r["voice_message"]);
          
          var ad: any = document.getElementById("advert_7");
          if (ad){
            ad.volume = 0.1;
            setTimeout(()=>{ad.volume = 1.0}, 5000)  
          }
 
          say_this.volume = 1.0;
          say_this.rate = 0.8;
        
          say_this.voice = this.voice;
          this.synth.speak(say_this);
        } 
      }
    );
  }

  // dev mode: collecting(slot => drink taken) dismissal(slot => collected) convenience 
  collect_order(order_item_id : string) {
    if (!this.dev_mode) return false;
    this.slots.find((o)=>{return o.order_item_id == order_item_id})['transition_out'] = true;
    this.api.collect_order(order_item_id).subscribe(
      r => {
        if(r['ok']) {
        } 
      }
    );
  }

  // reducing of ad video
  reduce_first = true;
  reduced = false;
  front_play_elapsed = 0;
  elapse_counter : any;
  allow_push_to_back = true;

  reduce_cancel(){
    if (this.reduce_first) {
      this.reduced = true;
      this.reduce_first = false;
    } else {
      if (document.getElementById("ad_panel") != null){
        document.getElementById("ad_panel").classList.add('fadeOutUp');
      }

      if ((this.allow_push_to_back) && (this.ad_no == 0)){
        console.log(this.front_play_elapsed);
        clearInterval(this.elapse_counter);
        this.resume_play_at_back(this.front_play_elapsed);
      }

      setTimeout(()=>{
        if (document.getElementById("ad_panel") != null){
          document.getElementById("ad_panel").classList.remove('fadeOutUp');
        }
        this.cancel();
      }, 1500)
    }
  }



  //////////////////// STATS graphing /////////

  width: number;
  height: number;
  margin = {top: 40, right: 40, bottom: 40, left: 40};

  x: any;
  y: any;
  svg: any;
  g: any;

  from_date : string;
  to_date : string;
  
  now_date = new Date();
  
  this_date_obj : any = new Date(this.now_date.getFullYear(), this.now_date.getMonth(), this.now_date.getDate());
  this_date : any = this.this_date_obj.toISOString();
  this_date_rep = new Date(this.this_date).toLocaleDateString("en",
    {  
      year: "numeric",
      month: "2-digit",
      day: "numeric"
    } 
  );
  
  initted = false;
  stats : any;
  StatsBarChart = [];

  initSvg() {
    d3.select("#barChart").select("svg").remove();
    this.svg = d3.select("#barChart")
      .append("svg")
      .attr("width", '100%')
      .attr("height", '100%')
      .attr('viewBox','0 0 1600 500');
    this.g = this.svg.append("g")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
  }

  initAxis() {
    this.x = d3Scale.scaleBand().rangeRound([0, this.width]).padding(0.1);
    this.y = d3Scale.scaleLinear().rangeRound([this.height, 0]);
    this.x.domain(this.StatsBarChart.map((d) => d.drink));
    this.y.domain([0, d3Array.max(this.StatsBarChart, (d) => d.drink_count)]);

    this.y.tickFormat(d3Format.format(",d"));
  }

  drawAxis() {
    this.g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + this.height + ")")
        .style("font-size", "32px")
        .call(d3Axis.axisBottom(this.x));
    
    var no_ticks = d3Array.max(this.StatsBarChart, (d) => d.drink_count); 
    if (no_ticks > 10) {no_ticks = 10}

    console.log(no_ticks);
    this.g.append("g")
        .style("font-size", "28px")
        .attr("class", "axis axis--y")
        .call(d3Axis.axisLeft(this.y).ticks(no_ticks))
        .append("text")
        .attr("class", "axis-title")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.5rem")
        .attr("text-anchor", "end")
        .text("Frequency");
  }

  drawBars() {
    this.g.selectAll(".bar")
        .data(this.StatsBarChart)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", (d) => this.x(d.drink) )
        .attr("y", (d) => this.y(d.drink_count) )
        .attr("width", this.x.bandwidth())
        .style("fill", "#EEB8D5")
        .attr("height", (d) => this.height - this.y(d.drink_count) );
  }


  // called with new date value
  gen_chart() {
    console.log("generating for" + this.this_date);
    if (!this.initted) {

      this.width = 1600 - this.margin.left - this.margin.right ;
      this.height = 500 - this.margin.top - this.margin.bottom;
      this.initSvg();
     // this.initAxis();

      this.initted = true;
    }
    
    // call API to fetch data
    this.api.get_order_data(
      this.this_date
    )
      .subscribe(
        (r) => {
          this.svg.selectAll("g > *").remove();

          this.stats = r.rows.map((d)=> {return {drink: d['key'][3], drink_count: d['value']} ;} ) ;
          this.StatsBarChart = this.stats;
          console.log(this.StatsBarChart);
          this.initAxis();
          this.drawAxis();
          this.drawBars();
        },
        (r) => {
        });
  }

  // date modifier for charting
  date_changed(){
    this.gen_chart();
  }

  prev_day(){  
    var d:any = new Date(this.this_date);
    
    var prev_day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() -  24 * 60 * 60 * 1000;
    
    this.this_date_obj = new Date(prev_day);
    this.this_date = this.this_date_obj.toISOString();
    this.this_date_rep = new Date(this.this_date).toLocaleDateString("en",
      {  
        year: "numeric",
        month: "2-digit",
        day: "numeric"
      } 
    );

    this.gen_chart();
  }

  next_day(){
    var d:any = new Date(this.this_date);

    var next_day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() +  24 * 60 * 60 * 1000;

    this.this_date_obj = new Date(next_day);
    this.this_date = this.this_date_obj.toISOString();
    this.this_date_rep = new Date(this.this_date).toLocaleDateString("en",
      {  
        year: "numeric",
        month: "2-digit",
        day: "numeric"
      } 
    );
    
    this.gen_chart();
  }

}