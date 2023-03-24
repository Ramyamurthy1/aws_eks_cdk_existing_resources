import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as eks from '@aws-cdk/aws-eks';
import * as ec2 from '@aws-cdk/aws-ec2';
import { PhysicalName } from '@aws-cdk/core';

export class ClusterStack extends cdk.Stack {

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const primaryRegion = 'us-west-2';
    const clusterAdmin = new iam.Role(this, 'AdminRole', {
                              assumedBy: new iam.AccountRootPrincipal()

                             }); 

    // const vpc = new ec2.Vpc(this, 'my-cdk-vpc', {
    //                         cidr: '172.34.0.0/16',
    //                          natGateways: 1,
    //                          maxAzs: 2,
    //                          subnetConfiguration: [
    //                             {
    //                                     name: 'private-subnet-cp-1',
    //                                     subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
    //                                     cidrMask: 28,
    //                             },
    //                             {
    //                                     name: 'public-subnet-cp-1',
    //                                     subnetType: ec2.SubnetType.PUBLIC,
    //                                     cidrMask: 24,

    //                             },
    //                     ]
    //               });

    const vpc =  ec2.Vpc.fromVpcAttributes(this, 'dish-replicate-vpc', {
                    vpcId: 'vpc-085de50ab1db71c6a', // this is the vpc-id from the first stack
                    availabilityZones: ['us-west-2a', 'us-west-2b']
                })  
                
    const cluster = new eks.Cluster(this, 'eks-lcm-cluster', {
                                clusterName: `lcm-test-cluster`,
                                mastersRole: clusterAdmin,
                                version: eks.KubernetesVersion.V1_21,
                                defaultCapacity: 0,
                                vpc: vpc,
                                vpcSubnets: [
                                  {
                                      subnets: [
                                        ec2.Subnet.fromSubnetAttributes(this,"dish-replicate-subnet-public1-us-west-2a", {
                                              availabilityZone: "us-west-2a",
                                              subnetId: "subnet-08586237e35794c03",
                                              routeTableId: "rtb-058dcd032830e8ce3"
                                        }),
                                        ec2.Subnet.fromSubnetAttributes(this,'dish-replicate-subnet-private1-us-west-2a', {
                                            availabilityZone: "us-west-2a",
                                            subnetId: "subnet-099db10eddd9800ad",
                                            routeTableId: "rtb-0ff4e17d7978891a3"
                                        }),
                                        ec2.Subnet.fromSubnetAttributes(this, 'dish-replicate-subnet-public2-us-west-2b', {
                                            availabilityZone: "us-west-2b",
                                            subnetId: "subnet-0a9feec36bf882a0c",
                                            routeTableId: "rtb-058dcd032830e8ce3"
                                          }),
                                          ec2.Subnet.fromSubnetAttributes(this,'dish-replicate-subnet-private2-us-west-2b', {
                                            availabilityZone: "us-west-2b",
                                            subnetId: "subnet-0ef5f107b2b9b6967",
                                            routeTableId: "rtb-0967696f964f7ffb2"
                                         }),
                                      ]
                                }],
    })



  }
}

function createDeployRole(scope: cdk.Construct, id: string, cluster: eks.Cluster): iam.Role {
  const role = new iam.Role(scope, id, {
    roleName: PhysicalName.GENERATE_IF_NEEDED,
    assumedBy: new iam.AccountRootPrincipal()
  });
  cluster.awsAuth.addMastersRole(role);

  return role;
}