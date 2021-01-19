The structure of project INCENDI's database is the following : 

	"authentication" : {
		$user_id : {
			- role : string
			- school : $school_id
		}
	},

	"infos" : {
		"contact" : {
			- name : string,
			- address : string
		}
	},

	"superadmin" : {
		$user_id : {
			- name : string
			- surname : string
			- email : string
		}
	},

	"schools" : {
		$school_id : {
			"infos" : {
				- name : string,
				- site_url : uri
			},
			"admin" : {
				$user_id : {
					- name : string
					- surname : string
					- email : string
				}
			},
			"database" : {
				"users" : {
					$user_id : {
						- name : string,
						- surname : string,
						- email : string,
						- role : $role_id,
						- additional_info : string #OPTIONNAL
					}
				},

				"children" : {
					$child_id : {
						- name : string,
						- surname : string,
						- date_of_birth : date,
						- class : string, #OPTIONNAL
						- additional_info : string, #OPTIONNAL
						- img_url : uri

					}
				},

				"roles" : {
					$role_id : {
						- role_name : string
					}
				}

				"children_profile" : {
					$child_id : {
						- infos : {
							$info_id : {
								- name: string
								- items : {
									$item_id : {
										name : string
									}
								}
							}
						}
					}
				},

				"relationships" : {
					$user_id : {
						$child_id : boolean,
					}
					
				},

				"children_categories" : {
					$child_id : {
						$category_id : {
							- name : string,
							- archived : boolean,
							- skills : {
								$skill_id : {
									- name : string,
									- archived : boolean,
									- acquired : boolean
								}
							}
						}
					}
				},

				"children_news" : {
					$child_id : {
						$news_id : {
							- date : timestamp,
							- author : $user_id,
							- text : string
						}
					}
				},

				"children_meetings" : {
					$child_id : {
						$meeting_id : {
							- finished : boolean,
							- emails : [
								email : string
							]
							- participants : [
								{
									id : $user_id,
									name : string,
									email : string
								}
							]
							- date : timestamp,
							- additional_notes : string,
							- pdf_url : uri
						}
					}	
				},

				"children_skills" : {
					$child_id : {
						$category_id : {
							$skill_id : {
								- old_latest : $meeting_id,
								- lastest : $meeting_id,
								$meeting_id : {
									- value : int
								}
							}
						}
					}	
				},

				"children_solutions" : {
					$child_id : {
						$solution_id : {
							- date : timestamp,
							- author : $user_id,
							- text : string,
							- title : string
						}
					}
				}
			}
		}
	}